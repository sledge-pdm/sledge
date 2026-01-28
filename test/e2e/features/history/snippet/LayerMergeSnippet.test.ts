import { BlendMode } from '@sledge-pdm/frasco';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { layerMergeSnippet } from '~/features/history/command/snippet/LayerMergeCommands';
import { CommandsHistoryEntry } from '~/features/history/entry/CommandsHistoryEntry';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { LayerType, type Layer } from '~/features/layer/types';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { disposeFrascoRenderer, initFrascoRenderer } from '~/webgl/FrascoRenderer';
import { createWebGLCanvas } from '../../../../support/e2e';

const buildLayer = (id: string, name = id, opacity = 1, mode: BlendMode = BlendMode.normal): Layer => ({
  id,
  name,
  type: LayerType.Dot,
  opacity,
  mode,
  enabled: true,
  cutFreeze: false,
});

const setRuntimeStore = (layers: Layer[]) => {
  setProjectStore('canvas', 'size', { width: 1, height: 1 });
  setProjectStore('layers', 'layers', layers);
  setProjectStore('layers', 'state', 'activeLayerId', layers[0]?.id ?? '');
  setProjectStore('layers', 'state', 'selectionEnabled', false);
  setProjectStore('layers', 'state', 'selected', new Set<string>());
  setProjectStore('layers', 'state', 'baseLayer', { colorMode: 'transparent' });
};

const expectPixelNear = (pixel: Uint8Array, expected: [number, number, number, number], tolerance = 1) => {
  const actual = [pixel[0], pixel[1], pixel[2], pixel[3]];
  expected.forEach((value, index) => {
    expect(Math.abs(actual[index] - value)).toBeLessThanOrEqual(tolerance);
  });
};

describe('LayerMergeCommands snippet (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(async () => {
    document.body.innerHTML = '';
    setRuntimeStore([buildLayer('origin', 'origin', 0.5), buildLayer('target', 'target')]);
    layerManager.registerLayer('origin', new Uint8ClampedArray([255, 0, 0, 255]), 1, 1, { inputSpace: 'canvas' });
    layerManager.registerLayer('target', new Uint8ClampedArray([0, 0, 255, 255]), 1, 1, { inputSpace: 'canvas' });

    canvas = createWebGLCanvas().canvas;
    const { width, height } = projectStore.canvas.size;
    initFrascoRenderer(canvas, { width, height, layers: projectStore.layers.layers });
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  });

  afterEach(() => {
    disposeFrascoRenderer();
    layerManager.disposeAll();
    canvas.remove();
  });

  it('merges GPU composite into target layer and restores on undo', () => {
    const { commands, context } = layerMergeSnippet('origin', 'target', { contextTool: 'merge' });
    const entry = new CommandsHistoryEntry(commands, context);

    entry.redo();
    expect(projectStore.layers.layers.map((layer) => layer.id)).toEqual(['target']);

    const merged = layerManager.getLayerOptional('target');
    expect(merged).toBeTruthy();
    const mergedPixels = merged!.readPixels();
    expectPixelNear(mergedPixels, [128, 0, 128, 255]);

    entry.undo();
    expect(projectStore.layers.layers.map((layer) => layer.id)).toEqual(['origin', 'target']);

    const restored = layerManager.getLayerOptional('target');
    expect(restored).toBeTruthy();
    const restoredPixels = restored!.readPixels();
    expectPixelNear(restoredPixels, [0, 0, 255, 255]);

    entry.redo();
    const redoPixels = merged!.readPixels();
    expectPixelNear(redoPixels, [128, 0, 128, 255]);
  });
});
