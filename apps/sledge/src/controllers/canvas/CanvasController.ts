import { Size2D } from '@sledge/core';
import { allLayers } from '~/controllers/layer/LayerListController';
import { Consts } from '~/models/Consts';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { canvasStore, setCanvasStore } from '~/stores/ProjectStores';
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
  const sectionBetweenArea = document.getElementById('sections-between-area')!;
  const areaBound = sectionBetweenArea.getBoundingClientRect();
  const width = areaBound.width;
  const height = areaBound.height;

  if (width < height) {
    return width * referenceLengthRatio;
  } else {
    return height * referenceLengthRatio;
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
  setZoom(referencedZoom);

  centeringCanvas();
};

export const centeringCanvas = () => {
  const canvasSize = canvasStore.canvas;
  // const canvasArea = interactStore.canvasAreaSize;
  const sectionBetweenArea = document.getElementById('sections-between-area');
  if (!sectionBetweenArea) return;
  const areaBound = sectionBetweenArea.getBoundingClientRect();
  const zoom = interactStore.zoom;

  setInteractStore('offsetOrigin', {
    x: areaBound.x + areaBound.width / 2 - (canvasSize.width * zoom) / 2,
    y: areaBound.height / 2 - (canvasSize.height * zoom) / 2,
  });
  setOffset({
    x: 0,
    y: 0,
  });
  setRotation(0);

  eventBus.emit('canvas:onAdjusted', {});
};

export const setZoom = (zoom: number): boolean => {
  zoom = Math.round(zoom * Math.pow(10, Consts.zoomPrecisionSignificantDigits)) / Math.pow(10, Consts.zoomPrecisionSignificantDigits);
  if (zoom > 0 && zoom !== interactStore.zoom) {
    setInteractStore('zoom', zoom);
    return true;
  }
  return false;
};

export const setOffset = (offset: { x: number; y: number }) => {
  if (offset.x !== interactStore.offset.x || offset.y !== interactStore.offset.y) {
    setInteractStore('offset', offset);
  }
};

export const setRotation = (rotation: number) => {
  if (rotation !== interactStore.rotation) setInteractStore('rotation', Math.round(rotation % 360));
};
