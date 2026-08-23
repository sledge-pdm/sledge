import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectLoader } from '~/features/io/project/ProjectLoader';
import { saveProject } from '~/features/io/project/ProjectSave';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { CURRENT_PROJECT_VERSION } from '~/features/project/Consts';
import { setIOStore } from '~/stores/EditorStores';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import { unpackFromBytes } from '~/utils/msgpackr';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../../history/helpers';

const SIZE = 8;

function makePattern(size: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (x + y * size) * 4;
      out[idx] = (x * 31) % 256;
      out[idx + 1] = (y * 47) % 256;
      out[idx + 2] = (x + y) % 256;
      out[idx + 3] = 255;
    }
  }
  return out;
}

const sameBytes = (actual: Uint8Array, expected: Uint8Array) => expect(Array.from(actual)).toEqual(Array.from(expected));

/**
 * a save assembles for long enough that the user can undo halfway through it. frasco's own tests cover what
 * `exportPacked` hands back in that case; this covers the part only sledge can see - that those bytes survive
 * being packed into a `.sledge`, read back out, and pushed onto a fresh layer.
 */
describe('io/project/save interrupted by an undo (e2e)', () => {
  let platform: TestMockPlatform;
  let written: Uint8Array | undefined;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    platform.core.isTauri = vi.fn(() => true) as any;

    setupWebGL();
    const layers = [buildLayer('a')];
    resetStore(layers, { width: SIZE, height: SIZE });
    registerLayers(layers, SIZE, SIZE, makePattern(SIZE));

    setIOStore('openAs', 'project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    setIOStore('loadProjectVersion', { project: CURRENT_PROJECT_VERSION, sledge: '1.0.0' });
    setIOStore('recentFiles', []);
    setProjectStore('snapshots', []);

    written = undefined;
    platform.dialog.save = vi.fn(async () => 'C:/work/demo.sledge') as any;
    platform.dialog.confirm = vi.fn(async () => true) as any;
    platform.fs.writeFile = vi.fn(async (_path: string, data: Uint8Array) => {
      written = data;
    }) as any;
    platform.fs.exists = vi.fn(async () => false) as any;
    platform.fs.mkdir = vi.fn(async () => undefined) as any;
    platform.fs.rename = vi.fn(async () => undefined) as any;
    platform.fs.remove = vi.fn(async () => undefined) as any;
    platform.path.appDataDir = vi.fn(async () => 'C:/AppData') as any;
    platform.app.getVersion = vi.fn(async () => '1.2.3') as any;
  });

  it('writes a file that still loads, with the history intact', async () => {
    const layer = layerManager.getLayer('a');
    const pattern = layer.readPixels();
    layer.commitHistory();
    layer.clear([0, 0, 0, 0]);
    const cleared = layer.readPixels();

    // packing a stack runs synchronously as far as the fence wait, so an undo on the next line lands
    // inside the readback - the one moment where the snapshot can change under the export
    const exportHistoryPacked = layer.exportHistoryPacked.bind(layer);
    vi.spyOn(layer, 'exportHistoryPacked').mockImplementation(() => {
      const packing = exportHistoryPacked();
      layer.undo();
      return packing;
    });

    expect(await saveProject('demo.sledge', 'C:/work')).toBe(true);
    expect(written).toBeDefined();

    const project = unpackFromBytes(written!);
    const stacks = project.history.layerHistories['a'];
    expect(stacks.undoStack).toHaveLength(1);
    expect(stacks.redoStack).toHaveLength(1);
    // the undo moved that snapshot across and swapped its pixels. a cache that ignored the swap would put
    // the same bytes on both stacks.
    expect(Array.from(stacks.redoStack[0].deflated)).not.toEqual(Array.from(stacks.undoStack[0].deflated));

    const result = await ProjectLoader.fromProjectObj({ project }).load();
    expect(result.ok).toBe(true);

    const reloaded = layerManager.getLayer('a');
    // the layer buffer was read before the undo, so the file holds the state the save started from
    sameBytes(reloaded.readPixels(), cleared);

    reloaded.undo();
    sameBytes(reloaded.readPixels(), pattern);

    reloaded.redo();
    sameBytes(reloaded.readPixels(), cleared);
  });
});
