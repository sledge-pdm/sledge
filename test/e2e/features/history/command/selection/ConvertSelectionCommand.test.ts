import { gzipDeflate } from '@sledge-pdm/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type PackedLayerSnapshot } from '~/features/history/actions/types';
import { ConvertSelectionCommand } from '~/features/history/command/selection/ConvertSelectionCommand';
import { ImagePoolEntry, ImagePoolImage } from '~/features/image_pool';
import { imagePoolImages, setImagePoolImages } from '~/features/image_pool/imageStore';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { type Layer } from '~/features/layer/types';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../helpers';

const buildEntry = (id: string): ImagePoolEntry => ({
  id,
  base: { width: 1, height: 1 },
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
  opacity: 1,
  visible: true,
});

const buildImage = (): ImagePoolImage => ({
  mimeType: 'image/png',
  deflatedBuffer: new Uint8Array([1, 2, 3]),
});

const packSnapshot = (layer: Layer, buffer: Uint8ClampedArray, width: number, height: number): PackedLayerSnapshot => ({
  layer: { ...layer },
  image: {
    packedBuffer: gzipDeflate(buffer),
    width,
    height,
  },
});

describe('ConvertSelectionCommand (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
    const layer = buildLayer('layer-1');
    resetStore([layer]);
    registerLayers([layer], projectStore.canvas.size.width, projectStore.canvas.size.height, new Uint8ClampedArray([0, 0, 255, 255]));
    setProjectStore('imagePool', 'entries', []);
    setImagePoolImages(new Map());
  });

  afterEach(() => {
    layerManager.disposeAll();
    canvas.remove();
  });

  it('switches image pool snapshots and restores layer buffers', () => {
    const oldEntries = [buildEntry('old')];
    const newEntries = [buildEntry('new')];
    const oldImages = new Map<string, ImagePoolImage>([['old', buildImage()]]);
    const newImages = new Map<string, ImagePoolImage>([['new', buildImage()]]);

    setProjectStore('imagePool', 'entries', oldEntries);
    setImagePoolImages(oldImages);

    const layer = projectStore.layers.layers[0];
    const beforeBuffer = new Uint8ClampedArray([0, 0, 255, 255]);
    const afterBuffer = new Uint8ClampedArray([255, 0, 0, 255]);
    const beforeSnapshot = packSnapshot(layer, beforeBuffer, 1, 1);
    const afterSnapshot = packSnapshot(layer, afterBuffer, 1, 1);

    const command = new ConvertSelectionCommand({
      layerId: layer.id,
      oldEntries,
      newEntries,
      oldImages,
      newImages,
      beforeSnapshot,
      afterSnapshot,
    });

    command.forward();
    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['new']);
    expect(imagePoolImages().get('new')).toEqual(newImages.get('new'));
    const forwardPixels = layerManager.getLayerOptional(layer.id)?.readPixels();
    expect(Array.from(forwardPixels ?? [])).toEqual(Array.from(afterBuffer));

    command.backward();
    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['old']);
    expect(imagePoolImages().get('old')).toEqual(oldImages.get('old'));
    const backwardPixels = layerManager.getLayerOptional(layer.id)?.readPixels();
    expect(Array.from(backwardPixels ?? [])).toEqual(Array.from(beforeBuffer));
    expect(command.getContext().description).toContain('cut');
  });
});
