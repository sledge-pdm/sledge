import { beforeEach, describe, expect, it } from 'vitest';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { getProjectFromRuntime } from '~/stores/RuntimeProject';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../history/helpers';

const SIZE = 4;

// what a save actually asks for. snapshots are skipped because they need a file on disk to restore from.
const exportProject = () => getProjectFromRuntime({ includeSnapshots: false });

const deflatedOf = (project: Awaited<ReturnType<typeof exportProject>>, layerId: string) => project.layers.buffers.get(layerId)!.deflatedBuffer;

describe('save-time layer buffer cache (e2e)', () => {
  beforeEach(() => {
    setupWebGL();
    const layers = [buildLayer('a'), buildLayer('b')];
    resetStore(layers, { width: SIZE, height: SIZE });
    registerLayers(layers, SIZE, SIZE);
  });

  it('hands back the very same bytes when nothing was touched', async () => {
    const first = await exportProject();
    const second = await exportProject();

    // identity, not equality: a recompression would produce a different array holding the same bytes
    expect(deflatedOf(second, 'a')).toBe(deflatedOf(first, 'a'));
    expect(deflatedOf(second, 'b')).toBe(deflatedOf(first, 'b'));
  });

  it('recompresses only the layer that was drawn on', async () => {
    const first = await exportProject();

    layerManager.getLayer('a').clear([255, 0, 0, 255]);
    const second = await exportProject();

    expect(deflatedOf(second, 'a')).not.toBe(deflatedOf(first, 'a'));
    expect(deflatedOf(second, 'b')).toBe(deflatedOf(first, 'b'));
  });

  it('recompresses after undo moved the pixels back', async () => {
    const layer = layerManager.getLayer('a');
    layer.commitHistory();
    layer.clear([255, 0, 0, 255]);
    const first = await exportProject();

    layer.undo();
    const second = await exportProject();

    expect(deflatedOf(second, 'a')).not.toBe(deflatedOf(first, 'a'));
  });

  it('recompresses every layer after a canvas resize', async () => {
    const first = await exportProject();

    layerManager.resizeAll(SIZE + 2, SIZE + 2);
    setProjectStore('canvas', 'size', { width: SIZE + 2, height: SIZE + 2 });
    const second = await exportProject();

    expect(deflatedOf(second, 'a')).not.toBe(deflatedOf(first, 'a'));
    expect(deflatedOf(second, 'b')).not.toBe(deflatedOf(first, 'b'));
  });

  it('reuses history snapshot bytes across saves', async () => {
    layerManager.getLayer('a').commitHistory();

    const first = await exportProject();
    const second = await exportProject();

    const firstStack = first.history.layerHistories!['a'].undoStack;
    const secondStack = second.history.layerHistories!['a'].undoStack;

    expect(firstStack.length).toBe(1);
    expect(secondStack[0].deflated).toBe(firstStack[0].deflated);
  });

  it('restores a layer history from the bytes it exported', async () => {
    const layer = layerManager.getLayer('a');
    const before = layer.readPixels();
    layer.commitHistory();
    layer.clear([255, 0, 0, 255]);
    const after = layer.readPixels();

    const exported = await exportProject();
    const stacks = exported.history.layerHistories!['a'];

    // a reload registers the layer from the saved pixels and pushes the stored history back onto it
    registerLayers([buildLayer('a')], SIZE, SIZE);
    layerManager.importHistoryPacked('a', stacks.undoStack, stacks.redoStack);
    const reloaded = layerManager.getLayer('a');
    reloaded.writePixels(after);

    reloaded.undo();
    expect(Array.from(reloaded.readPixels())).toEqual(Array.from(before));
  });
});
