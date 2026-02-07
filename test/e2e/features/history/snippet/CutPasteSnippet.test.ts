import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cutPasteSnippet } from '~/features/history/command/snippet/CutPasteCommands';
import { CommandsHistoryEntry } from '~/features/history/entry/CommandsHistoryEntry';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { createWebGLCanvas } from '../../../../support/e2e';
import { buildLayer, resetStore } from '../helpers';

const readPixel = (layerId: string): Uint8Array => {
  const layer = layerManager.getLayerOptional(layerId);
  if (!layer) throw new Error(`layer not found: ${layerId}`);
  return layer.readPixels();
};

describe('CutPasteCommands snippet (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    const setup = createWebGLCanvas();
    canvas = setup.canvas;

    resetStore([buildLayer('a'), buildLayer('b')]);

    layerManager.registerLayer('a', new Uint8ClampedArray([0, 0, 255, 255]), 1, 1, { inputSpace: 'canvas' });
    layerManager.registerLayer('b', new Uint8ClampedArray([0, 255, 0, 255]), 1, 1, { inputSpace: 'canvas' });
  });

  afterEach(() => {
    layerManager.disposeAll();
    canvas.remove();
  });

  it('reorders and restores layers while preserving pixel data', () => {
    const srcBuffer = new Uint8ClampedArray([255, 0, 0, 255]);
    const { commands, context } = cutPasteSnippet(1, projectStore.layers.layers[0], srcBuffer);
    const entry = new CommandsHistoryEntry(commands, context);

    const lines = entry.getCommandLines();
    expect(lines.map((line) => line.redoOrder)).toEqual([0, 1]);
    expect(lines.map((line) => line.undoOrder)).toEqual([1, 0]);

    entry.redo();
    expect(projectStore.layers.layers.map((layer) => layer.id)).toEqual(['b', 'a']);
    expect(projectStore.layers.state.activeLayerId).toBe('a');
    expect(Array.from(readPixel('a').slice(0, 4))).toEqual([255, 0, 0, 255]);

    entry.undo();
    expect(projectStore.layers.layers.map((layer) => layer.id)).toEqual(['a', 'b']);
    expect(projectStore.layers.state.activeLayerId).toBe('b');
    expect(Array.from(readPixel('a').slice(0, 4))).toEqual([0, 0, 255, 255]);
  });
});
