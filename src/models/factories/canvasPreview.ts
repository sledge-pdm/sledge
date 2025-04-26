export function createPreviewCanvas(imageData: ImageData, targetHeight: number): HTMLCanvasElement {
  const aspectRatio = imageData.width / imageData.height;
  const targetWidth = Math.round(targetHeight * aspectRatio);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = imageData.width;
  tmpCanvas.height = imageData.height;
  tmpCanvas.getContext('2d')!.putImageData(imageData, 0, 0);

  ctx.drawImage(
    tmpCanvas,
    0,
    0,
    imageData.width,
    imageData.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return canvas;
}
