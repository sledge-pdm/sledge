import { Component, onMount } from 'solid-js';
import { getAgentOf } from '~/controllers/canvas/layer/LayerAgentManager';
import { ThumbnailGenerator } from '~/controllers/canvas/ThumbnailGenerator';
import { Layer } from '~/models/canvas/layer/Layer';
import { canvasStore } from '~/stores/ProjectStores';
import { layerPreviewCanvas } from '~/styles/components/layer_preview.css';
import { listenEvent } from '~/utils/TauriUtils';

interface Props {
  layer: Layer;
  maxWidth?: number;
  maxHeight?: number;
  onClick?: () => void;
}

const LayerPreview: Component<Props> = (props: Props) => {
  let wrapperRef: HTMLDivElement;
  let canvasRef: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  const thumbnailGen = new ThumbnailGenerator();

  onMount(() => {
    // renderer = new WebGLRenderer(canvasRef); ←！！
    updatePreview();

    const agent = getAgentOf(props.layer.id);
    agent?.setOnImageChangeListener('layer_prev_' + props.layer.id, (e) => {
      if (e.updatePreview) updatePreview();
    });

    listenEvent('onResetAllLayers', () => {
      updatePreview();
    });
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
      if (preview) {
        ctx?.putImageData(preview, 0, 0);
      }
    }
  };

  return (
    <div ref={(el) => (wrapperRef = el)}>
      <canvas
        class={layerPreviewCanvas}
        ref={(el) => {
          canvasRef = el;
          ctx = canvasRef.getContext('2d')!;
        }}
        style={{
          'image-rendering': 'pixelated',
        }}
        onClick={(e) => {
          if (props.onClick) props.onClick();
        }}
      />
    </div>
  );
};

export default LayerPreview;
