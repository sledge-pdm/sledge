import { Component, onCleanup, onMount } from 'solid-js';
import { ThumbnailGenerator } from '~/controllers/canvas/ThumbnailGenerator';
import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { Layer } from '~/models/layer/Layer';
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

  const handleUpdateReqEvent = (e: Events['preview:requestUpdate']) => {
    if (e.layerId === props.layer.id) {
      updatePreview();
    }
  };

  onMount(() => {
    updatePreview();
    eventBus.on('preview:requestUpdate', handleUpdateReqEvent);
    eventBus.on('canvas:sizeChanged', updatePreview);
  });

  onCleanup(() => {
    eventBus.off('preview:requestUpdate', handleUpdateReqEvent);
    eventBus.off('canvas:sizeChanged', updatePreview);
  });

  const updatePreview = () => {
    const targetHeight = wrapperRef.clientHeight;
    const aspectRatio = canvasStore.canvas.width / canvasStore.canvas.height;
    const targetWidth = Math.round(targetHeight * aspectRatio);
    const maxWidth = props.maxWidth;
    const maxHeight = props.maxHeight;
    let zoom = 1;
    if (maxWidth && targetWidth > maxWidth) zoom = maxWidth / targetWidth;
    if (maxHeight && targetHeight > maxHeight && zoom < maxHeight / targetHeight) zoom = maxHeight / targetHeight;

    const previewWidth = targetWidth * zoom;
    const previewHeight = targetHeight * zoom;

    canvasRef.width = previewWidth;
    canvasRef.height = previewHeight;
    canvasRef.style.width = `${targetWidth}px`;
    canvasRef.style.height = `${targetHeight}px`;

    const agent = getAgentOf(props.layer.id);
    if (agent) {
      const preview = thumbnailGen.generateLayerThumbnail(agent, previewWidth, previewHeight);
      if (preview && ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.putImageData(preview, 0, 0);
      }
    }
  };

  return (
    <div ref={(el) => (wrapperRef = el)}>
      <canvas
        class='layer-preview-canvas'
        ref={(el) => {
          canvasRef = el;
          ctx = canvasRef.getContext('2d')!;
        }}
        style={{
          'image-rendering': 'auto',
        }}
        onClick={(e) => {
          if (props.onClick) props.onClick(e);
        }}
      />
    </div>
  );
};

export default LayerPreview;
