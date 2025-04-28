import { canvasStore, setCanvasStore } from '~/stores/project/canvasStore';

const REFERENCE_LENGTH = 600;

export const getReferencedZoom = (length?: number) => {
  if (length === undefined) {
    const width = canvasStore.canvas.width;
    const height = canvasStore.canvas.height;
    length = width > height ? width : height;
    if (!length) return undefined;
  }

  return REFERENCE_LENGTH / length;
};

export const adjustZoomToFit = (width?: number, height?: number) => {
  if (width === undefined) width = canvasStore.canvas.width;
  if (height === undefined) height = canvasStore.canvas.height;
  if (!width || !height) return;

  const isWide = width > height;
  const longerLength = isWide ? width : height;

  console.log(
    `this is ${isWide ? 'wide' : 'tall'}.
      ${REFERENCE_LENGTH} / ${longerLength} = ${REFERENCE_LENGTH / longerLength}. set zoom.`
  );

  const referencedZoom = getReferencedZoom(longerLength);
  if (!referencedZoom) return;
  setCanvasStore('zoom', referencedZoom);
  centeringCanvas();
};

export const centeringCanvas = () => {
  const canvasSize = canvasStore.canvas;
  const canvasArea = canvasStore.canvasAreaSize;
  const zoom = canvasStore.zoom;

  console.log(
    `area size is ${canvasArea.width} x ${canvasArea.height}.
      canvas size is ${canvasSize.width} x ${canvasSize.height}.
      current offset origin is ${canvasStore.offsetOrigin.x}, ${canvasStore.offsetOrigin.y}.
      new offset origin is ${canvasStore.canvasAreaSize.width / 2 - canvasStore.canvas.width / 2}, ${canvasStore.canvasAreaSize.height / 2 - canvasStore.canvas.height / 2}`
  );

  setCanvasStore('offsetOrigin', {
    x: canvasArea.width / 2 - (canvasSize.width * zoom) / 2,
    y: canvasArea.height / 2 - (canvasSize.height * zoom) / 2,
  });
  setCanvasStore('offset', {
    x: 0,
    y: 0,
  });
};
