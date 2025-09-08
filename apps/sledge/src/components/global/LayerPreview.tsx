import { vars } from '@sledge/theme';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Component, createSignal, onCleanup, onMount } from 'solid-js';
import { Consts } from '~/Consts';
import { ThumbnailGenerator } from '~/features/canvas/ThumbnailGenerator';
import { Layer } from '~/features/layer';
import { getAgentOf } from '~/features/layer/LayerAgentManager';
import { canvasStore } from '~/stores/ProjectStores';
import '~/styles/components/layer_preview.css';
import { eventBus, Events } from '~/utils/EventBus';

interface Props {
  layer: Layer;
  maxWidth?: number;
  maxHeight?: number;
  onClick?: (e: MouseEvent) => void;
}

const LayerPreview: Component<Props> = (props: Props) => {
  let wrapperRef: HTMLDivElement;
  let canvasRef: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  const thumbnailGen = new ThumbnailGenerator();

  // RAF and update state management
  const [needsUpdate, setNeedsUpdate] = createSignal<boolean>(false);
  const [isRunning, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS((timeStamp) => {
      if (needsUpdate()) {
        performUpdate();
        setNeedsUpdate(false);
      }
    }, 2)
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

  const performUpdate = async () => {
    if (!wrapperRef || !canvasRef || !ctx) return;

    const targetHeight = wrapperRef.clientHeight;
    const aspectRatio = canvasStore.canvas.width / canvasStore.canvas.height;
    const targetWidth = Math.round(targetHeight * aspectRatio);

    if (targetWidth === 0 || targetHeight === 0) return;

    const maxWidth = props.maxWidth;
    const maxHeight = props.maxHeight;
    let zoom = 1;
    if (maxWidth && targetWidth > maxWidth) zoom = maxWidth / targetWidth;
    if (maxHeight && targetHeight > maxHeight && zoom < maxHeight / targetHeight) zoom = maxHeight / targetHeight;

    const previewWidth = targetWidth * zoom;
    const previewHeight = targetHeight * zoom;

    // Only resize canvas if dimensions actually changed
    if (canvasRef.width !== previewWidth || canvasRef.height !== previewHeight) {
      canvasRef.width = previewWidth;
      canvasRef.height = previewHeight;
      canvasRef.style.width = `${targetWidth}px`;
      canvasRef.style.height = `${targetHeight}px`;
      lastPreviewWidth = previewWidth;
      lastPreviewHeight = previewHeight;
    }

    const agent = getAgentOf(props.layer.id);
    if (agent) {
      const preview = thumbnailGen.generateLayerThumbnail(agent, previewWidth, previewHeight);
      if (preview) {
        // ctx.imageSmoothingEnabled = true;
        // ctx.imageSmoothingQuality = 'high';
        ctx.putImageData(preview, 0, 0);
      }
    }
  };

  const transparent_bg_color = '#00000020';
  const gridSize = () => 8;

  return (
    <div
      ref={(el) => (wrapperRef = el)}
      style={{
        'background-color': vars.color.canvas,
        'z-index': Consts.zIndex.layerPreview,
      }}
    >
      <canvas
        class='layer-preview-canvas'
        ref={(el) => {
          canvasRef = el;
          ctx = canvasRef.getContext('2d')!;
        }}
        style={{
          'image-rendering': 'auto',
          'background-image':
            `linear-gradient(45deg, ${transparent_bg_color} 25%, transparent 25%, transparent 75%, ${transparent_bg_color} 75%),` +
            `linear-gradient(45deg, ${transparent_bg_color} 25%, transparent 25%, transparent 75%, ${transparent_bg_color} 75%)`,
          'background-size': `${gridSize() * 2}px ${gridSize() * 2}px`,
          'background-position': `0 0, ${gridSize()}px ${gridSize()}px`,
        }}
        onClick={(e) => {
          if (props.onClick) props.onClick(e);
        }}
      />
    </div>
  );
};

export default LayerPreview;
