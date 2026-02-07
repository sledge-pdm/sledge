import { BlendMode } from '@sledge-pdm/frasco';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { layerMergeSnippet } from '~/features/history/command/snippet/LayerMergeCommands';
import { CommandsHistoryEntry } from '~/features/history/entry/CommandsHistoryEntry';
import { findLayerById, getLayerIndex } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { disposeFrascoRenderer, frascoRenderer, initFrascoRenderer } from '~/webgl/FrascoRenderer';
import { createWebGLCanvas } from '../../../../support/e2e';
import { buildLayer, resetStore } from '../helpers';

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
    const origin = buildLayer('origin', 'origin');
    origin.opacity = 0.5;
    const target = buildLayer('target', 'target');
    resetStore([origin, target]);
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
    expect(projectStore.layers.state.activeLayerId).toBe('target');

    const merged = layerManager.getLayerOptional('target');
    expect(merged).toBeTruthy();
    const mergedPixels = merged!.readPixels();
    expectPixelNear(mergedPixels, [128, 0, 128, 255]);

    entry.undo();
    expect(projectStore.layers.layers.map((layer) => layer.id)).toEqual(['origin', 'target']);
    expect(projectStore.layers.state.activeLayerId).toBe('origin');

    const restored = layerManager.getLayerOptional('target');
    expect(restored).toBeTruthy();
    const restoredPixels = restored!.readPixels();
    expectPixelNear(restoredPixels, [0, 0, 255, 255]);

    entry.redo();
    const redoPixels = merged!.readPixels();
    expectPixelNear(redoPixels, [128, 0, 128, 255]);
  });

  it('updates target props via LayerPropsCommand', async () => {
    disposeFrascoRenderer();
    layerManager.disposeAll();
    canvas.remove();

    const origin = buildLayer('origin', 'origin');
    origin.opacity = 0.5;
    const target = buildLayer('target', 'target');
    target.opacity = 0.2;
    target.mode = BlendMode.multiply;
    resetStore([origin, target]);
    canvas = createWebGLCanvas().canvas;
    layerManager.registerLayer('origin', new Uint8ClampedArray([255, 0, 0, 255]), 1, 1, { inputSpace: 'canvas' });
    layerManager.registerLayer('target', new Uint8ClampedArray([0, 0, 255, 255]), 1, 1, { inputSpace: 'canvas' });
    const { width, height } = projectStore.canvas.size;
    initFrascoRenderer(canvas, { width, height, layers: projectStore.layers.layers });
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    expect(findLayerById('origin')).toBeTruthy();
    expect(findLayerById('target')).toBeTruthy();
    expect(getLayerIndex('origin')).toBeGreaterThan(-1);
    expect(getLayerIndex('target')).toBeGreaterThan(-1);
    expect(layerManager.getLayerOptional('target')).toBeTruthy();
    expect(frascoRenderer).toBeTruthy();

    const { commands, context } = layerMergeSnippet('origin', 'target', { contextTool: 'merge' });
    expect(commands).not.toHaveLength(0);
    const entry = new CommandsHistoryEntry(commands, context);

    entry.redo();
    const targetAfter = projectStore.layers.layers.find((layer) => layer.id === 'target');
    expect(targetAfter?.opacity).toBe(1);
    expect(targetAfter?.mode).toBe(BlendMode.normal);

    entry.undo();
    const restoredTarget = projectStore.layers.layers.find((layer) => layer.id === 'target');
    expect(restoredTarget?.opacity).toBe(0.2);
    expect(restoredTarget?.mode).toBe(BlendMode.multiply);
  });

  it('returns empty commands when target is missing', () => {
    resetStore([buildLayer('origin', 'origin')]);
    const result = layerMergeSnippet('origin', 'target');
    expect(result.commands).toHaveLength(0);
  });

  it('returns empty commands when target layer is not registered', () => {
    layerManager.removeLayer('target');
    const result = layerMergeSnippet('origin', 'target');
    expect(result.commands).toHaveLength(0);
  });

  it('returns empty commands when renderer is missing', () => {
    disposeFrascoRenderer();
    const result = layerMergeSnippet('origin', 'target');
    expect(result.commands).toHaveLength(0);
  });
});
