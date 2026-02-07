import { gzipDeflate } from '@sledge-pdm/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CanvasSizeCommand } from '~/features/history/command/canvas/CanvasSizeCommand';
import { PackedLayerSnapshot } from '~/features/history/snapshot';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { buildLayer, resetStore, setupWebGL } from '../../helpers';

const packSnapshot = (layerId: string, buffer: Uint8ClampedArray, width: number, height: number): PackedLayerSnapshot => ({
  layer: buildLayer(layerId),
  image: {
    packedBuffer: gzipDeflate(buffer),
    width,
    height,
  },
});

const buildSolidBuffer = (width: number, height: number, rgba: [number, number, number, number]) => {
  const buffer = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    buffer.set(rgba, i * 4);
  }
  return buffer;
};

describe('CanvasSizeCommand (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
    resetStore([]);
    selectionManager.clearAll();
  });

  afterEach(() => {
    selectionManager.clearAll();
    layerManager.disposeAll();
    canvas.remove();
  });

  it('applies snapshot-based resize forward/backward', () => {
    const base = buildLayer('layer-1');
    resetStore([base], { width: 1, height: 1 });
    layerManager.registerLayer('layer-1', buildSolidBuffer(1, 1, [1, 0, 0, 255]), 1, 1, { inputSpace: 'layer' });

    const selection = new SelectionMask(1, 1);
    selection.setMask(new Uint8Array([1]));
    selectionManager.setBack(selection);

    const beforeSnapshots: PackedLayerSnapshot[] = [packSnapshot('layer-1', buildSolidBuffer(1, 1, [1, 0, 0, 255]), 1, 1)];
    const afterSnapshots: PackedLayerSnapshot[] = [packSnapshot('layer-1', buildSolidBuffer(1, 1, [2, 0, 0, 255]), 1, 1)];

    const command = new CanvasSizeCommand({
      beforeSize: { width: 1, height: 1 },
      afterSize: { width: 2, height: 2 },
      beforeSnapshots,
      afterSnapshots,
      historyMode: 'snapshot',
    });

    command.forward();
    expect(projectStore.canvas.size).toEqual({ width: 2, height: 2 });
    expect(selectionManager.getBack()?.getWidth()).toBe(2);
    expect(selectionManager.getBack()?.getHeight()).toBe(2);
    expect(layerManager.readPixelCanvas('layer-1', 0, 0)).toEqual([2, 0, 0, 255]);

    command.backward();
    expect(projectStore.canvas.size).toEqual({ width: 1, height: 1 });
    expect(selectionManager.getBack()?.getWidth()).toBe(1);
    expect(selectionManager.getBack()?.getHeight()).toBe(1);
    expect(layerManager.readPixelCanvas('layer-1', 0, 0)).toEqual([1, 0, 0, 255]);
  });

  it('captures snapshots via registerBefore/registerAfter', () => {
    const base = buildLayer('layer-1');
    resetStore([base], { width: 1, height: 1 });
    layerManager.registerLayer('layer-1', buildSolidBuffer(1, 1, [5, 0, 0, 255]), 1, 1, { inputSpace: 'layer' });

    const command = new CanvasSizeCommand({
      beforeSize: { width: 1, height: 1 },
      afterSize: { width: 1, height: 1 },
      historyMode: 'snapshot',
    });

    command.registerBefore();

    const layer = layerManager.getLayer('layer-1');
    layer.writePixels(buildSolidBuffer(1, 1, [0, 5, 0, 255]), { bounds: { x: 0, y: 0, width: 1, height: 1 } });
    command.registerAfter();

    command.backward();
    expect(layerManager.readPixelCanvas('layer-1', 0, 0)).toEqual([5, 0, 0, 255]);

    command.forward();
    expect(layerManager.readPixelCanvas('layer-1', 0, 0)).toEqual([0, 5, 0, 255]);
  });

  it('applies layer history for specified layerIds', () => {
    const a = buildLayer('a');
    const b = buildLayer('b');
    resetStore([a, b], { width: 1, height: 1 });

    layerManager.registerLayer('a', buildSolidBuffer(1, 1, [10, 0, 0, 255]), 1, 1, { inputSpace: 'layer' });
    layerManager.registerLayer('b', buildSolidBuffer(1, 1, [0, 10, 0, 255]), 1, 1, { inputSpace: 'layer' });

    const layerA = layerManager.getLayer('a');
    const layerB = layerManager.getLayer('b');

    layerA.commitHistory();
    layerB.commitHistory();

    layerA.resizeClear(2, 2);
    layerB.resizeClear(2, 2);

    layerA.writePixels(buildSolidBuffer(2, 2, [20, 0, 0, 255]), { bounds: { x: 0, y: 0, width: 2, height: 2 } });
    layerB.writePixels(buildSolidBuffer(2, 2, [0, 20, 0, 255]), { bounds: { x: 0, y: 0, width: 2, height: 2 } });

    setProjectStore('canvas', 'size', { width: 2, height: 2 });

    const command = new CanvasSizeCommand({
      beforeSize: { width: 1, height: 1 },
      afterSize: { width: 2, height: 2 },
      historyMode: 'layer',
      layerIds: ['a'],
    });

    command.backward();
    expect(projectStore.canvas.size).toEqual({ width: 1, height: 1 });
    expect(layerA.getWidth()).toBe(1);
    expect(layerManager.readPixelCanvas('a', 0, 0)).toEqual([10, 0, 0, 255]);
    expect(layerB.getWidth()).toBe(2);
    expect(layerManager.readPixelCanvas('b', 0, 0)).toEqual([0, 20, 0, 255]);

    command.forward();
    expect(projectStore.canvas.size).toEqual({ width: 2, height: 2 });
    expect(layerA.getWidth()).toBe(2);
    expect(layerManager.readPixelCanvas('a', 0, 0)).toEqual([20, 0, 0, 255]);
    expect(layerB.getWidth()).toBe(2);
    expect(layerManager.readPixelCanvas('b', 0, 0)).toEqual([0, 20, 0, 255]);
  });
});
