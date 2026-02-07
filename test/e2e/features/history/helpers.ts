import { Layer } from '@sledge-pdm/core';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { NEW_LAYER_PROPS } from '~/features/layer/service';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { createWebGLCanvas } from '../../../support/e2e';

export const buildLayer = (id: string, name = id): Layer => ({
  ...NEW_LAYER_PROPS,
  id,
  name,
});

export const resetStore = (layers: Layer[], canvasSize: { width: number; height: number } = { width: 1, height: 1 }) => {
  for (const layer of projectStore.layers.layers) {
    layerManager.removeLayer(layer.id);
  }
  setProjectStore('canvas', 'size', { width: canvasSize.width, height: canvasSize.height });
  setProjectStore('layers', 'layers', layers);
  setProjectStore('layers', 'state', 'activeLayerId', layers[0]?.id ?? '');
  setProjectStore('layers', 'state', 'selectionEnabled', false);
  setProjectStore('layers', 'state', 'selected', new Set<string>());
  setProjectStore('layers', 'state', 'baseLayer', { colorMode: 'transparent' });
};

export const setupWebGL = (): HTMLCanvasElement => {
  const { canvas } = createWebGLCanvas();
  return canvas;
};

export const registerLayers = (layers: Layer[], width: number, height: number, buffer?: Uint8ClampedArray) => {
  const baseBuffer = buffer ?? new Uint8ClampedArray(width * height * 4);
  layers.forEach((layer) => {
    layerManager.registerLayer(layer.id, baseBuffer, width, height, { inputSpace: 'canvas' });
  });
};
