import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Component, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { Layer } from '~/features/layer';
import { LayerThumbnailGenerator } from '~/features/layer/LayerThumbnailGenerator';
import { canvasStore } from '~/stores/ProjectStores';
import { eventBus, Events } from '~/utils/EventBus';

const canvas = css`
  width: 100%;
  height: 100%;
  image-rendering: crisp-edges;
`;

interface Props {
  layer: Layer;

  // どちらを基準にするかを明示的に指定
  sizingMode: 'width-based' | 'height-based';

  // 基準となる値
  referenceSize: number;

  // 最大値制限（オプション）
  maxWidth?: number;
  maxHeight?: number;

  // maxに抵触した際の挙動
  fitMode?: 'contain' | 'cover'; // default: 'contain'

  withBorder?: boolean;

  updateInterval?: number; // ms, default: on demand
  onClick?: (e: MouseEvent) => void;
}

const LayerPreview: Component<Props> = (props: Props) => {
  let canvasRef: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  const thumbnailGen = new LayerThumbnailGenerator();

  // RAF and update state management
  const [needsUpdate, setNeedsUpdate] = createSignal<boolean>(false);
  const [isRunning, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS((timeStamp) => {
      if (needsUpdate()) {
        performUpdate();
        setNeedsUpdate(false);
      }
    }, props.updateInterval ?? 10)
  );

  // Cache last computed dimensions to avoid unnecessary canvas resizing
  let lastPreviewWidth = 0;
  let lastPreviewHeight = 0;

  const requestUpdate = () => {
    if (!isRunning()) {
      startRenderLoop();
    }
    setNeedsUpdate(true);
  };

  const handleUpdateReqEvent = (e: Events['preview:requestUpdate']) => {
    if (e.layerId === props.layer.id) {
      requestUpdate();
    }
  };

  const handleCanvasSizeChanged = () => {
    requestUpdate();
  };

  onMount(() => {
    performUpdate();
    eventBus.on('preview:requestUpdate', handleUpdateReqEvent);
    eventBus.on('canvas:sizeChanged', handleCanvasSizeChanged);
  });

  onCleanup(() => {
    stopRenderLoop();
    eventBus.off('preview:requestUpdate', handleUpdateReqEvent);
    eventBus.off('canvas:sizeChanged', handleCanvasSizeChanged);
  });

  createEffect(() => {
    props.layer;
    performUpdate();
  });

  const performUpdate = async () => {
    if (!canvasRef || !ctx) return;

    const canvasAspectRatio = canvasStore.canvas.width / canvasStore.canvas.height;
    const fitMode = props.fitMode ?? 'contain';

    let targetWidth: number;
    let targetHeight: number;

    // sizingModeに基づいて基準サイズを決定
    if (props.sizingMode === 'width-based') {
      targetWidth = props.referenceSize;
      targetHeight = Math.round(targetWidth / canvasAspectRatio);
    } else {
      // height-based
      targetHeight = props.referenceSize;
      targetWidth = Math.round(targetHeight * canvasAspectRatio);
    }

    if (targetWidth === 0 || targetHeight === 0) return;

    // 最大値制限の適用とfitModeの処理
    const maxWidth = props.maxWidth;
    const maxHeight = props.maxHeight;

    let finalWidth = targetWidth;
    let finalHeight = targetHeight;

    // maxWidth/maxHeightに引っかかった場合の処理
    if ((maxWidth && targetWidth > maxWidth) || (maxHeight && targetHeight > maxHeight)) {
      if (fitMode === 'contain') {
        // contain: アスペクト比を保ったまま制限内に収める（従来の動作）
        let zoom = 1;
        if (maxWidth && targetWidth > maxWidth) zoom = maxWidth / targetWidth;
        if (maxHeight && targetHeight > maxHeight && zoom > maxHeight / targetHeight) zoom = maxHeight / targetHeight;

        finalWidth = Math.round(targetWidth * zoom);
        finalHeight = Math.round(targetHeight * zoom);
      } else {
        // cover: referenceSize を満たすように他方を調整
        if (props.sizingMode === 'width-based') {
          finalWidth = Math.min(targetWidth, maxWidth || targetWidth);
          if (maxHeight && targetHeight > maxHeight) {
            // 高さ制限に引っかかった場合、referenceSize（幅）を維持して高さを制限
            finalHeight = maxHeight;
            finalWidth = props.referenceSize; // 幅は必ずreferenceSize
          } else {
            finalHeight = targetHeight;
          }
        } else {
          // height-based
          finalHeight = Math.min(targetHeight, maxHeight || targetHeight);
          if (maxWidth && targetWidth > maxWidth) {
            // 幅制限に引っかかった場合、referenceSize（高さ）を維持して幅を制限
            finalWidth = maxWidth;
            finalHeight = props.referenceSize; // 高さは必ずreferenceSize
          } else {
            finalWidth = targetWidth;
          }
        }
      }
    }

    const previewWidth = Math.round(finalWidth);
    const previewHeight = Math.round(finalHeight);

    // Only resize canvas if dimensions actually changed
    if (canvasRef.width !== previewWidth || canvasRef.height !== previewHeight) {
      canvasRef.width = previewWidth;
      canvasRef.height = previewHeight;

      // スタイル設定も新しい設計に合わせて調整
      canvasRef.style.width = `${previewWidth}px`;
      canvasRef.style.height = `${previewHeight}px`;

      lastPreviewWidth = previewWidth;
      lastPreviewHeight = previewHeight;
    }

    const preview = thumbnailGen.generateLayerThumbnail(props.layer.id, previewWidth, previewHeight);
    if (preview) {
      // ctx.imageSmoothingEnabled = true;
      // ctx.imageSmoothingQuality = 'high';
      ctx.putImageData(preview, 0, 0);
    }
  };

  const transparent_bg_color = '#00000020';
  const gridSize = () => 8;

  return (
    <div
      style={{
        display: 'flex',
        width: 'fit-content',
        height: 'fit-content',
        'background-color': color.canvas,
        'z-index': 'var(--zindex-layer-preview)',
      }}
    >
      <canvas
        class={canvas}
        ref={(el) => {
          canvasRef = el;
          ctx = canvasRef.getContext('2d')!;
        }}
        style={{
          'image-rendering': 'pixelated',
          'background-image': `url(/patterns/CheckerboardPattern.svg)`,
          'background-size': `${gridSize() * 2}px ${gridSize() * 2}px`,
          'background-position': `0 0, ${gridSize()}px ${gridSize()}px`,
          border: props.withBorder ? `1px solid ${color.canvasBorder}` : undefined,
        }}
        onClick={(e) => {
          if (props.onClick) props.onClick(e);
        }}
      />
    </div>
  );
};

export default LayerPreview;
