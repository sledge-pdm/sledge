import { beforeEach, describe, expect, it, vi } from 'vitest';
import { busyStore, currentBusyOperation, isBusy, runExclusive } from '~/features/busy';
import { historyManager, tryRedo, tryUndo } from '~/features/history';
import { clipboardCopy, clipboardCut } from '~/features/io/clipboard/ClipboardActions';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { CURRENT_PROJECT_VERSION } from '~/features/project/Consts';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { loadSnapshot, registerCurrentProjectSnapshot } from '~/features/snapshot';
import { setInteractStore, setIOStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../history/helpers';

const SIZE = 4;
const LAYER_ID = 'layer-a';

const pixels = () => {
  const out = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let i = 0; i < SIZE * SIZE; i++) {
    out[i * 4] = (i * 17) % 256;
    out[i * 4 + 3] = 255;
  }
  return out;
};

/**
 * some operations are several others run end to end - a cut is a copy and a delete, restoring a snapshot is
 * a backup, a read and a load. each of those steps takes the window on its own when the user asks for it
 * directly, so the outer operation has to carry them through its own period rather than have them turned
 * down as a second operation.
 */
describe('features/busy nested operations (e2e)', () => {
  let platform: TestMockPlatform;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);

    document.body.innerHTML = '';
    setupWebGL();
    historyManager.clearHistory();
    selectionManager.clearAll();
    setInteractStore('placementPosition', { x: 0, y: 0 });

    const layer = buildLayer(LAYER_ID);
    resetStore([layer], { width: SIZE, height: SIZE });
    registerLayers([layer], SIZE, SIZE, pixels());
    setProjectStore('layers', 'state', 'activeLayerId', LAYER_ID);
    setProjectStore('imagePool', 'entries', []);
    setProjectStore('snapshots', []);

    setIOStore('openAs', 'project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    setIOStore('loadProjectVersion', { project: CURRENT_PROJECT_VERSION, sledge: '1.0.0' });
    platform.app.getVersion = vi.fn(async () => '1.2.3') as any;
  });

  const selectAll = () => {
    const mask = new Uint8Array(SIZE * SIZE).fill(1);
    selectionManager.setBack(new SelectionMask(SIZE, SIZE, mask));
  };

  it('carries the copy inside a cut through to the delete', async () => {
    selectAll();
    const before = layerManager.getLayer(LAYER_ID).readPixels();

    await clipboardCut();

    // the copy did not release and retake the window, so the delete that follows it actually ran
    expect(Array.from(layerManager.getLayer(LAYER_ID).readPixels())).not.toEqual(Array.from(before));
    expect(isBusy()).toBe(false);
  });

  it('reports the cut, not the copy inside it', async () => {
    selectAll();
    const seen: (string | undefined)[] = [];
    const writeImage = platform.clipboard.writeImage;
    platform.clipboard.writeImage = vi.fn(async (...args: unknown[]) => {
      seen.push(currentBusyOperation());
      return await (writeImage as any)(...args);
    }) as any;

    await clipboardCut();

    // the modal names the operation the user asked for throughout, not whichever step is running
    expect(seen).toEqual(['clipboardCut']);
  });

  it('still turns a copy down when it is a second operation rather than a step of one', async () => {
    selectAll();
    const gate = new Promise<void>((resolve) => setTimeout(resolve, 10));
    const running = runExclusive('imageImport', () => gate);

    await expect(clipboardCopy()).resolves.toBeUndefined();

    await running;
  });

  it('carries the backup inside a snapshot restore through to the load', async () => {
    const restored = await registerCurrentProjectSnapshot('restore me');
    expect(restored).toBeDefined();
    const restoreTarget = projectStore.snapshots[0];

    await loadSnapshot(restoreTarget, { backup: true });

    // the backup, the read and the load all ran inside one period: two snapshots now, the backup and the
    // one that was restored - and the window was given back
    expect(projectStore.snapshots.length).toBeGreaterThanOrEqual(2);
    expect(projectStore.snapshots.some((s) => s.name.startsWith('backup: '))).toBe(true);
    expect(isBusy()).toBe(false);
    expect(busyStore.operation).toBeUndefined();
  });

  it('refuses undo and redo wherever they are asked for', async () => {
    // one entry to step through, so a refusal cannot be mistaken for an empty stack
    const layer = layerManager.getLayer(LAYER_ID);
    layer.commitHistory();
    layer.clear([0, 0, 0, 0]);
    const cleared = layer.readPixels();

    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const running = runExclusive('save', () => gate);

    // the guard sits in tryUndo/tryRedo, so the shortcut, the on-canvas buttons and the mouse side buttons
    // are all covered by it rather than each having to remember
    tryUndo();
    expect(Array.from(layerManager.getLayer(LAYER_ID).readPixels())).toEqual(Array.from(cleared));

    release!();
    await running;

    tryUndo();
    expect(Array.from(layerManager.getLayer(LAYER_ID).readPixels())).not.toEqual(Array.from(cleared));
    tryRedo();
    expect(Array.from(layerManager.getLayer(LAYER_ID).readPixels())).toEqual(Array.from(cleared));
  });

  it('turns down a snapshot restore that arrives while something else is running', async () => {
    await registerCurrentProjectSnapshot('restore me');
    const target = projectStore.snapshots[0];
    const snapshotCountBefore = projectStore.snapshots.length;

    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const running = runExclusive('save', () => gate);

    await loadSnapshot(target, { backup: true });
    // nothing happened: no backup was taken, so the project it would have backed up is untouched
    expect(projectStore.snapshots).toHaveLength(snapshotCountBefore);

    release!();
    await running;
  });
});
