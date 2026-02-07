import { gzipDeflate } from '@sledge-pdm/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CanvasSizeCommand } from '~/features/history/command/canvas/CanvasSizeCommand';
import { PackedLayerSnapshot } from '~/features/history/snapshot';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { buildLayer, resetStore, setupWebGL } from '../../helpers';

const packSnapshot = (layerId: string, buffer: Uint8ClampedArray, width: number, height: number): PackedLayerSnapshot => ({
  layer: buildLayer(layerId),
  image: {
    packedBuffer: gzipDeflate(buffer),
    width,
    height,
  },
});

describe('CanvasSizeCommand (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
    resetStore([]);
  });

  afterEach(() => {
    layerManager.disposeAll();
    canvas.remove();
  });

  it('applies snapshot-based resize forward/backward', () => {
    const beforeSnapshots: PackedLayerSnapshot[] = [packSnapshot('layer-1', new Uint8ClampedArray([1, 0, 0, 255]), 1, 1)];
    const afterSnapshots: PackedLayerSnapshot[] = [
      packSnapshot('layer-1', new Uint8ClampedArray([2, 0, 0, 255, 3, 0, 0, 255, 4, 0, 0, 255, 5, 0, 0, 255]), 2, 2),
    ];

    const command = new CanvasSizeCommand({
      beforeSize: { width: 1, height: 1 },
      afterSize: { width: 2, height: 2 },
      beforeSnapshots,
      afterSnapshots,
      historyMode: 'snapshot',
    });

    command.forward();
    expect(projectStore.canvas.size).toEqual({ width: 2, height: 2 });

    command.backward();
    expect(projectStore.canvas.size).toEqual({ width: 1, height: 1 });
  });
});
