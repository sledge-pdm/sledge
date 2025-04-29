import { Component, onMount } from 'solid-js';
import { getImageOf, layerImageManager } from '~/routes/editor';
import { layerPreviewCanvas } from '~/styles/components/layer_preview.css';
import { Layer } from '~/types/Layer';

interface Props {
  layer: Layer;
  maxWidth?: number;
  maxHeight?: number;
  onClick?: () => void;
}

const LayerPreview: Component<Props> = (props: Props) => {
  let wrapperRef: HTMLDivElement;
  let canvasRef: HTMLCanvasElement;

  const updatePreview = (originalImage: ImageData, targetHeight: number) => {
    const aspectRatio = originalImage.width / originalImage.height;
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
    tmpCanvas.width = originalImage.width;
    tmpCanvas.height = originalImage.height;
    tmpCanvas.getContext('2d')!.putImageData(originalImage, 0, 0);

    const ctx = canvasRef.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    ctx.drawImage(tmpCanvas, 0, 0, originalImage.width, originalImage.height, 0, 0, targetWidth, targetHeight);
  };

  onMount(() => {
    const height = wrapperRef.clientHeight;
    const currentImage = getImageOf(props.layer.id);

    let agent = layerImageManager.getAgent(props.layer.id);
    if (currentImage) {
      agent?.setImage(currentImage, true);
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
