import { Component } from 'solid-js';
import { Layer } from '~/models/layer/Layer';
import { getImageOf, layerAgentManager } from '~/routes/editor';
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

  const updatePreview = (originalImage: Uint8ClampedArray, targetHeight: number) => {
    const aspectRatio = canvasStore.canvas.width / canvasStore.canvas.height;
    const targetWidth = Math.round(targetHeight * aspectRatio);

    // 描画対象キャンバスの解像度とCSSサイズを一致させる
    canvasRef.width = targetWidth;
    canvasRef.height = targetHeight;

    const maxWidth = props.maxWidth;
    const maxHeight = props.maxHeight;
    let zoom = 1;
    if (maxWidth && targetWidth > maxWidth) zoom = maxWidth / targetWidth;
    if (maxHeight && targetHeight > maxHeight && zoom < maxHeight / targetHeight) zoom = maxHeight / targetHeight;

    canvasRef.style.width = `${targetWidth * zoom}px !important`;
    canvasRef.style.height = `${targetHeight * zoom}px !important`;

    wrapperRef.style.width = `${targetWidth * zoom}px !important`;
    wrapperRef.style.height = `${targetHeight * zoom}px !important`;

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = canvasStore.canvas.width;
    tmpCanvas.height = canvasStore.canvas.height;
    tmpCanvas.getContext('2d')!.putImageData(new ImageData(originalImage, canvasStore.canvas.width, canvasStore.canvas.height), 0, 0);

    const ctx = canvasRef.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    ctx.drawImage(tmpCanvas, 0, 0, canvasStore.canvas.width, canvasStore.canvas.height, 0, 0, targetWidth, targetHeight);
  };

  listenEvent('onProjectLoad', () => {
    const height = wrapperRef.clientHeight;
    const currentImage = getImageOf(props.layer.id);

    let agent = layerAgentManager.getAgent(props.layer.id);
    if (currentImage) {
      updatePreview(currentImage, height);
    }

    agent?.setOnImageChangeListener('layer_prev_' + props.layer.id, () => {
      const img = getImageOf(props.layer.id);
      if (img) updatePreview(img, height);
    });
  });

  return (
    <div ref={(el) => (wrapperRef = el)}>
      <canvas
        class={layerPreviewCanvas}
        ref={(el) => (canvasRef = el)}
        onClick={(e) => {
          if (props.onClick) props.onClick();
        }}
      />
    </div>
  );
};

export default LayerPreview;
