import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Component, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { Layer } from '~/features/layer';
import { LayerThumbnailGenerator } from '~/features/layer/LayerThumbnailGenerator';
import { canvasStore } from '~/stores/ProjectStores';
import { eventBus, Events } from '~/utils/EventBus';
import { calcPreviewSize } from '~/utils/ThumbnailUtils';

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

    const previewSize = calcPreviewSize({
      canvasSize: canvasStore.canvas,
      sizingMode: props.sizingMode,
      referenceSize: props.referenceSize,
      fitMode: props.fitMode,
      maxWidth: props.maxWidth,
      maxHeight: props.maxHeight,
    });

    const previewWidth = Math.round(previewSize.width);
    const previewHeight = Math.round(previewSize.height);
    if (previewWidth === 0 || previewHeight === 0) return;

    if (canvasRef.width !== previewWidth || canvasRef.height !== previewHeight) {
      canvasRef.width = previewWidth;
      canvasRef.height = previewHeight;
      canvasRef.style.width = `${previewWidth}px`;
      canvasRef.style.height = `${previewHeight}px`;
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
