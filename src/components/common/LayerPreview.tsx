import { Component, createEffect, createSignal, onMount } from 'solid-js';
import { layerAgentManager } from '~/controllers/layer/LayerAgentManager';
import { WebGLRenderer } from '~/controllers/webgl/WebGLRenderer';
import { Layer } from '~/models/layer/Layer';
import { canvasStore } from '~/stores/ProjectStores';
import { layerPreviewCanvas } from '~/styles/components/layer_preview.css';
import { Size2D } from '~/types/Size';

interface Props {
  layer: Layer;
  maxWidth?: number;
  maxHeight?: number;
  onClick?: () => void;
}

const LayerPreview: Component<Props> = (props: Props) => {
  let wrapperRef: HTMLDivElement;
  let canvasRef: HTMLCanvasElement;
  let renderer: WebGLRenderer;

  const [previewSize, setPreviewSize] = createSignal<Size2D>({ width: 0, height: 0 });

  onMount(() => {
    renderer = new WebGLRenderer(canvasRef);
    updatePreviewSize();
    updatePreview();

    const agent = layerAgentManager.getAgent(props.layer.id);
    agent?.setOnImageChangeListener('layer_prev_' + props.layer.id, () => {
      updatePreviewSize();
      updatePreview();
    });
  });

  createEffect(() => {
    canvasStore.canvas.width;
    canvasStore.canvas.height;
    updatePreviewSize();
    updatePreview();
  });

  const updatePreviewSize = () => {
    const targetHeight = wrapperRef.clientHeight;
    const aspectRatio = canvasStore.canvas.width / canvasStore.canvas.height;
    const targetWidth = Math.round(targetHeight * aspectRatio);
    const maxWidth = props.maxWidth;
    const maxHeight = props.maxHeight;
    let zoom = 1;
    if (maxWidth && targetWidth > maxWidth) zoom = maxWidth / targetWidth;
    if (maxHeight && targetHeight > maxHeight && zoom < maxHeight / targetHeight) zoom = maxHeight / targetHeight;

    setPreviewSize({
      width: targetWidth * zoom,
      height: targetHeight * zoom,
    });
  };

  const updatePreview = () => {
    canvasRef.width = canvasStore.canvas.width;
    canvasRef.height = canvasStore.canvas.height;
    canvasRef.style.width = `${previewSize().width}px !important`;
    canvasRef.style.height = `${previewSize().height}px !important`;
    renderer.resize(canvasStore.canvas.width, canvasStore.canvas.height);
    renderer.render(props.layer);
  };

  return (
    <div ref={(el) => (wrapperRef = el)}>
      <canvas
        class={layerPreviewCanvas}
        ref={(el) => (canvasRef = el)}
        style={{
          'image-rendering': 'auto',
        }}
        onClick={(e) => {
          if (props.onClick) props.onClick();
        }}
      />
    </div>
  );
};

export default LayerPreview;
