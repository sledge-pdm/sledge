import { allLayers } from '~/controllers/layer/LayerListController';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { canvasStore, setCanvasStore } from '~/stores/ProjectStores';
import { Size2D } from '~/types/Size';
import { Consts } from '~/utils/consts';
import { eventBus } from '~/utils/EventBus';
import { getAgentOf } from '../layer/LayerAgentManager';

export function isValidCanvasSize(size: Size2D): boolean {
  if (size.width < Consts.minCanvasWidth || Consts.maxCanvasWidth < size.width) return false;
  if (size.height < Consts.minCanvasHeight || Consts.maxCanvasHeight < size.height) return false;
  return true;
}

export function changeCanvasSize(newSize: Size2D): boolean {
  if (!isValidCanvasSize(newSize)) return false;

  allLayers().forEach((layer) => {
    const agent = getAgentOf(layer.id);
    agent?.changeBufferSize(newSize, false);
  });

  setCanvasStore('canvas', newSize);
  eventBus.emit('canvas:sizeChanged', { newSize });
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
