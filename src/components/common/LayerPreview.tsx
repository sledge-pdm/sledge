import { Component, createEffect, onMount } from "solid-js";
import { Layer } from "~/models/types/Layer";
import { v4 as uuidv4 } from "uuid";

import styles from "@styles/components/layer_preview.module.css";
import { layerImageStore } from "~/stores/project/layerImageStore";

interface Props {
  layer: Layer;
  maxWidth?: number;
  maxHeight?: number;
  onClick?: () => void;
}

const LayerPreview: Component<Props> = (props: Props) => {
  const id = uuidv4();
  let wrapperRef: HTMLDivElement;
  let canvasRef: HTMLCanvasElement;

  const updatePreview = (originalImage: ImageData, targetHeight: number) => {
    const aspectRatio = originalImage.width / originalImage.height;
    const targetWidth = Math.round(targetHeight * aspectRatio);

    // 描画対象キャンバスの解像度とCSSサイズを一致させる
    canvasRef.width = targetWidth;
    canvasRef.height = targetHeight;

    const maxWidth = props.maxWidth
    const maxHeight = props.maxHeight
    let zoom = 1;
    // if (maxWidth && targetWidth > maxWidth) zoom = maxWidth / targetWidth;
    // if (maxHeight && targetHeight > maxHeight && zoom < maxHeight / targetHeight) zoom = maxHeight / targetHeight;

    canvasRef.style.width = `${targetWidth * zoom}px !important`;
    canvasRef.style.height = `${targetHeight * zoom}px !important`;

    wrapperRef.style.width = `${targetWidth * zoom}px !important`;
    wrapperRef.style.height = `${targetHeight * zoom}px !important`;

    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = originalImage.width;
    tmpCanvas.height = originalImage.height;
    tmpCanvas.getContext("2d")!.putImageData(originalImage, 0, 0);

    const ctx = canvasRef.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    ctx.drawImage(
      tmpCanvas,
      0,
      0,
      originalImage.width,
      originalImage.height,
      0,
      0,
      targetWidth,
      targetHeight,
    );
  };

  createEffect(() => {
    const originalImage = layerImageStore[props.layer.id].current
    const height = wrapperRef.clientHeight;
    updatePreview(originalImage, height);
  });

  return (
    <div ref={(el) => (wrapperRef = el)}>
      <canvas
        class={styles.canvas}
        ref={(el) => (canvasRef = el)}
        onClick={(e) => {
          if (props.onClick) props.onClick()
        }
        } />
    </div>
  );
};

export default LayerPreview;
