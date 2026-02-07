import { css } from '@acab/ecsstatic';
import { Layer, Size2D } from '@sledge-pdm/core';
import { LayerThumbnail } from '@sledge-pdm/frasco';
import { color } from '@sledge-pdm/ui';
import { Component, createEffect, createMemo, onMount } from 'solid-js';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { calcPreviewSize, calcThumbnailScale } from '~/utils/ThumbnailUtils';

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
  onClick?: (e: MouseEvent) => void;
}

const LayerPreview: Component<Props> = (props: Props) => {
  let canvasRef: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let thumbnail: LayerThumbnail | undefined = undefined;
  let currentLayerId: string | undefined;
  let currentScale = 0;
  const size = createMemo<Size2D>(() => {
    const canvasSize = {
      width: projectStore.canvas.size.width,
      height: projectStore.canvas.size.height,
    };
    return calcPreviewSize({
      canvasSize,
      sizingMode: props.sizingMode,
      referenceSize: props.referenceSize,
      fitMode: props.fitMode,
      maxWidth: props.maxWidth,
      maxHeight: props.maxHeight,
    });
  });

  const disposeThumbnail = () => {
    if (thumbnail) {
      thumbnail.dispose();
      thumbnail = undefined;
    }
    currentLayerId = undefined;
    currentScale = 0;
  };

  const setupThumbnail = () => {
    if (!canvasRef || !ctx) return;
    const { width, height } = projectStore.canvas.size;
    const nextScale = calcThumbnailScale(width, height);
    if (thumbnail && currentLayerId === props.layer.id && currentScale === nextScale) {
      return;
    }

    disposeThumbnail();
    const frascoLayer = layerManager.getLayerOptional(props.layer.id);
    if (!frascoLayer) return () => {};
    thumbnail = new LayerThumbnail(frascoLayer, { scale: nextScale });
    const removeUpdateListener = thumbnail.onUpdate(() => {
      performUpdate();
    });
    currentLayerId = props.layer.id;
    currentScale = nextScale;
    performUpdate();

    return () => {
      removeUpdateListener();
    };
  };

  onMount(() => {
    const cleanup = setupThumbnail();
    return () => {
      cleanup?.();
      disposeThumbnail();
    };
  });

  createEffect(() => {
    projectStore.canvas.size.width;
    projectStore.canvas.size.height;
    props.layer.id;
    const cleanup = setupThumbnail();
    if (!cleanup) return;
    return () => cleanup();
  });

  createEffect(() => {
    size();
    performUpdate();
  });

  const performUpdate = () => {
    const previewWidth = Math.round(size().width);
    const previewHeight = Math.round(size().height);
    if (previewWidth === 0 || previewHeight === 0) return;
    if (canvasRef.width !== previewWidth || canvasRef.height !== previewHeight) {
      canvasRef.width = previewWidth;
      canvasRef.height = previewHeight;
      canvasRef.style.width = `${previewWidth}px`;
      canvasRef.style.height = `${previewHeight}px`;
    }
    const preview = thumbnail?.getImageData(previewWidth, previewHeight);
    if (preview) {
      ctx.putImageData(preview, 0, 0);
    }
  };

  // const transparent_bg_color = '#00000020';
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
          'background-image': `url(/assets/patterns/CheckerboardPattern.svg)`,
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
