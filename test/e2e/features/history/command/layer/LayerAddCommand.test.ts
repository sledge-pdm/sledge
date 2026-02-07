import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LayerAddCommand } from '~/features/history/command/layer/LayerAddCommand';
import { getPackedLayerSnapshot } from '~/features/history/snapshot';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../../helpers';

describe('LayerAddCommand (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
    const base = buildLayer('base');
    resetStore([base]);
    registerLayers([base], projectStore.canvas.size.width, projectStore.canvas.size.height);
  });

  afterEach(() => {
    layerManager.disposeAll();
    canvas.remove();
  });

  it('applies, undoes, and redoes layer insertions', () => {
    const command = new LayerAddCommand({
      index: 1,
      layer: { name: 'new' },
      initImage: new Uint8ClampedArray(4),
      uniqueName: false,
      overrideLayerId: 'layer-1',
    });

    command.forward();
    expect(projectStore.layers.layers).toHaveLength(2);
    expect(projectStore.layers.layers[1].id).toBe('layer-1');
    expect(projectStore.layers.state.activeLayerId).toBe('layer-1');

    command.backward();
    expect(projectStore.layers.layers).toHaveLength(1);
    expect(projectStore.layers.layers[0].id).toBe('base');

    command.forward();
    expect(projectStore.layers.layers).toHaveLength(2);
    expect(projectStore.layers.layers[1].id).toBe('layer-1');
  });

  it('applies initImage pixels and cleans up on undo', () => {
    const initImage = new Uint8ClampedArray([9, 8, 7, 255]);
    const command = new LayerAddCommand({
      index: 1,
      layer: { name: 'pixel' },
      initImage,
      uniqueName: false,
      overrideLayerId: 'layer-pixel',
    });

    command.forward();
    expect(layerManager.readPixelCanvas('layer-pixel', 0, 0)).toEqual([9, 8, 7, 255]);

    command.backward();
    expect(projectStore.layers.layers.map((l) => l.id)).toEqual(['base']);
    expect(layerManager.getLayerOptional('layer-pixel')).toBeUndefined();
    expect(projectStore.layers.state.activeLayerId).toBe('base');
  });

  it('uses packedSnapshot insert path', () => {
    const snapLayer = buildLayer('snap', 'snap');
    resetStore([buildLayer('base'), snapLayer]);
    registerLayers(
      [projectStore.layers.layers[0], snapLayer],
      projectStore.canvas.size.width,
      projectStore.canvas.size.height,
      new Uint8ClampedArray([1, 2, 3, 255])
    );

    const snapshot = getPackedLayerSnapshot('snap');
    expect(snapshot).toBeDefined();
    setProjectStore('layers', 'layers', [projectStore.layers.layers[0]]);
    layerManager.removeLayer('snap');

    const command = new LayerAddCommand({
      index: 1,
      layer: { name: 'ignored' },
      packedSnapshot: snapshot,
    });

    command.forward();
    expect(projectStore.layers.layers).toHaveLength(2);
    expect(projectStore.layers.state.activeLayerId).toBe('base');
    expect(layerManager.readPixelCanvas('snap', 0, 0)).toEqual([1, 2, 3, 255]);

    command.backward();
    expect(projectStore.layers.layers).toHaveLength(1);
    expect(layerManager.getLayerOptional('snap')).toBeUndefined();
  });

  it('ensures unique layer names when enabled', () => {
    resetStore([buildLayer('base', 'layer')]);
    registerLayers([projectStore.layers.layers[0]], projectStore.canvas.size.width, projectStore.canvas.size.height);

    const command = new LayerAddCommand({
      index: 1,
      layer: { name: 'layer' },
      uniqueName: true,
      initImage: new Uint8ClampedArray(4),
    });

    command.forward();
    expect(projectStore.layers.layers[1].name).toBe('layer 2');
  });
});
