import { transparent } from '@sledge-pdm/core';
import { activeLayer, allLayers } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { frascoRenderer } from '~/webgl/FrascoRenderer';
import type { ColorSelectionSource, ColorSelectionTarget } from './types';

function flipBufferVertically(buffer: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const stride = width * 4;
  const flipped = new Uint8ClampedArray(buffer.length);
  for (let y = 0; y < height; y++) {
    const srcOffset = y * stride;
    const dstOffset = (height - 1 - y) * stride;
    flipped.set(buffer.subarray(srcOffset, srcOffset + stride), dstOffset);
  }
  return flipped;
}

export function buildColorSelectionSource(target: ColorSelectionTarget): ColorSelectionSource | undefined {
  const width = projectStore.canvas.size.width;
  const height = projectStore.canvas.size.height;
  if (width <= 0 || height <= 0) return;

  if (target === 'layer') {
    const layer = activeLayer();
    if (!layer) return;
    return {
      target,
      width,
      height,
      buffer: new Uint8ClampedArray(layerManager.exportRawCanvas(layer.id)),
    };
  }

  if (!frascoRenderer) return;
  const buffer = flipBufferVertically(frascoRenderer.renderLayersImmediate(allLayers(), transparent), width, height);
  if (buffer.length !== width * height * 4) return;

  return {
    target,
    width,
    height,
    buffer,
  };
}
