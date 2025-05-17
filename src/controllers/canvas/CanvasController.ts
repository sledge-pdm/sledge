import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { canvasStore, setCanvasStore } from '~/stores/ProjectStores';
import { Size2D } from '~/types/Size';
import { Consts } from '~/utils/consts';
import { allLayers } from '../layer/LayerListController';

export function changeCanvasSize(newSize: Size2D): boolean {
  if (newSize.width < Consts.minCanvasWidth || Consts.maxCanvasWidth < newSize.width) return false;
  if (newSize.height < Consts.minCanvasHeight || Consts.maxCanvasHeight < newSize.height) return false;
  setCanvasStore('canvas', newSize);

  allLayers().forEach((layer) => {
    const agent = getAgentOf(layer.id);
    agent?.changeBufferSize(newSize);
  });
  return true;
}

const referenceLengthRatio = 0.75;
const referenceLength = () => {
  const canvasAreaSize = interactStore.canvasAreaSize;
  if (canvasAreaSize.width < canvasAreaSize.height) {
    return canvasAreaSize.width * referenceLengthRatio;
  } else {
    return canvasAreaSize.height * referenceLengthRatio;
  }
};

export const getReferencedZoom = (length?: number) => {
  if (length === undefined) {
    const width = canvasStore.canvas.width;
    const height = canvasStore.canvas.height;
    length = width > height ? width : height;
  }

  return referenceLength() / length;
};

export const adjustZoomToFit = (width?: number, height?: number) => {
  if (width === undefined) width = canvasStore.canvas.width;
  if (height === undefined) height = canvasStore.canvas.height;
  if (!width || !height) return;

  const isWide = width > height;
  const longerLength = isWide ? width : height;

  const referencedZoom = getReferencedZoom(longerLength);
  if (!referencedZoom) return;
  setInteractStore('zoom', referencedZoom);

  centeringCanvas();
};

export const centeringCanvas = () => {
  const canvasSize = canvasStore.canvas;
  const canvasArea = interactStore.canvasAreaSize;
  const zoom = interactStore.zoom;

  setInteractStore('offsetOrigin', {
    x: canvasArea.width / 2 - (canvasSize.width * zoom) / 2,
    y: canvasArea.height / 2 - (canvasSize.height * zoom) / 2,
  });
  setInteractStore('offset', {
    x: 0,
    y: 0,
  });
};
