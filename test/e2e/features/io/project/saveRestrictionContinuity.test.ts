import { beforeEach, describe, expect, it, vi } from 'vitest';
import { busyStore, isBusy } from '~/features/busy';
import { saveProject } from '~/features/io/project/ProjectSave';
import { CURRENT_PROJECT_VERSION } from '~/features/project/Consts';
import { setIOStore } from '~/stores/EditorStores';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../../history/helpers';

const SIZE = 8;

/**
 * the restriction is taken before the save's first await and given back in its `finally`, so it should be on
 * without interruption from the moment the save is asked for until it is over - there is no point at which
 * it is switched on, and so no interval for an operation to slip through.
 *
 * these sample it at every yield the save has: each await is a point where control goes back to the event
 * loop and an input could be delivered. the native file dialog is the longest of them by far.
 */
describe('io/project/save restriction continuity (e2e)', () => {
  let platform: TestMockPlatform;
  /** `isBusy()` as seen at each yield, in the order they happened. */
  let samples: { at: string; busy: boolean }[];

  const sample = (at: string) => samples.push({ at, busy: isBusy() });

  /**
   * @description assert these boundaries were reached, in this order, without pinning down what else the
   *   save does between them - an extra read or version lookup is not what these tests are about.
   */
  const expectReachedInOrder = (expected: string[]) => {
    const reached = samples.map((s) => s.at);
    let from = 0;
    for (const at of expected) {
      const index = reached.indexOf(at, from);
      expect(index, `${at} was not reached after ${expected[expected.indexOf(at) - 1] ?? 'the start'} (saw ${reached.join(' -> ')})`).toBeGreaterThan(
        -1
      );
      from = index + 1;
    }
  };

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    platform.core.isTauri = vi.fn(() => true) as any;
    samples = [];

    setupWebGL();
    const layers = [buildLayer('a'), buildLayer('b')];
    resetStore(layers, { width: SIZE, height: SIZE });
    registerLayers(layers, SIZE, SIZE);

    setIOStore('openAs', 'project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    setIOStore('loadProjectVersion', { project: CURRENT_PROJECT_VERSION, sledge: '1.0.0' });
    setIOStore('recentFiles', []);
    setProjectStore('snapshots', []);

    // every boundary the save yields at reports what the restriction looked like from inside it
    platform.dialog.save = vi.fn(async () => {
      sample('dialog.save (open)');
      await Promise.resolve();
      sample('dialog.save (about to return)');
      return 'C:/work/demo.sledge';
    }) as any;
    platform.dialog.confirm = vi.fn(async () => {
      sample('dialog.confirm');
      return true;
    }) as any;
    platform.app.getVersion = vi.fn(async () => {
      sample('getVersion');
      return '1.2.3';
    }) as any;
    platform.fs.writeFile = vi.fn(async () => {
      sample('writeFile');
    }) as any;
    platform.fs.rename = vi.fn(async () => {
      sample('rename');
    }) as any;
    platform.fs.exists = vi.fn(async () => false) as any;
    platform.fs.mkdir = vi.fn(async () => undefined) as any;
    platform.fs.remove = vi.fn(async () => undefined) as any;
    platform.path.appDataDir = vi.fn(async () => 'C:/AppData') as any;
  });

  it('is already on before the caller gets control back, and never lapses', async () => {
    // "save as": the destination is chosen first, which is the longest yield the save has
    setIOStore('openAs', 'new_project');

    const saving = saveProject('demo.sledge');
    // the same tick the call was made in - nothing has awaited yet
    sample('caller, before awaiting');

    const result = await saving;
    expect(result).toBe('saved');

    expect(samples.every((s) => s.busy)).toBe(true);
    // and those points really were reached, so the check above is not vacuous
    expectReachedInOrder(['caller, before awaiting', 'dialog.save (open)', 'dialog.save (about to return)', 'writeFile', 'rename']);

    // given back only once the save is over
    expect(isBusy()).toBe(false);
  });

  it('never lapses on the overwrite path either', async () => {
    const saving = saveProject('demo.sledge', 'C:/work');
    sample('caller, before awaiting');

    expect(await saving).toBe('saved');
    expect(samples.every((s) => s.busy)).toBe(true);
    expectReachedInOrder(['caller, before awaiting', 'writeFile', 'rename']);
    expect(isBusy()).toBe(false);
  });

  it('never lapses while the overwrite confirmation is up', async () => {
    // an outdated project asks before overwriting, which is another dialog inside the destination step
    setIOStore('loadProjectVersion', { project: CURRENT_PROJECT_VERSION - 1, sledge: '1.0.0' });

    const saving = saveProject('demo.sledge', 'C:/work');
    sample('caller, before awaiting');

    expect(await saving).toBe('saved');
    expect(samples.every((s) => s.busy)).toBe(true);
    expect(samples.map((s) => s.at)).toContain('dialog.confirm');
    expect(isBusy()).toBe(false);
  });

  describe('the modal it puts up', () => {
    it('stays down while the destination is being chosen, and goes up once there is one', async () => {
      setIOStore('openAs', 'new_project');
      const visible: { at: string; shown: boolean }[] = [];
      platform.dialog.save = vi.fn(async () => {
        visible.push({ at: 'dialog.save', shown: busyStore.dialogVisible });
        return 'C:/work/demo.sledge';
      }) as any;
      platform.fs.writeFile = vi.fn(async () => {
        visible.push({ at: 'writeFile', shown: busyStore.dialogVisible });
      }) as any;

      const saving = saveProject('demo.sledge');
      visible.push({ at: 'caller, before awaiting', shown: busyStore.dialogVisible });

      expect(await saving).toBe('saved');

      expect(visible).toEqual([
        // the restriction is already on at both of these - only the cover is not
        { at: 'caller, before awaiting', shown: false },
        { at: 'dialog.save', shown: false },
        { at: 'writeFile', shown: true },
      ]);
      expect(busyStore.dialogVisible).toBe(false);
    });

    it('is never put up at all when the destination is declined', async () => {
      setIOStore('openAs', 'new_project');
      let shownDuringDialog = false;
      platform.dialog.save = vi.fn(async () => {
        shownDuringDialog = busyStore.dialogVisible;
        return null;
      }) as any;

      expect(await saveProject('demo.sledge')).toBe('cancelled');

      expect(shownDuringDialog).toBe(false);
      expect(busyStore.dialogVisible).toBe(false);
    });

    it('goes up straight away when there is no destination to ask for', async () => {
      // overwriting an existing project asks nothing, so there is nothing to wait behind
      let shownAtWrite = false;
      platform.fs.writeFile = vi.fn(async () => {
        shownAtWrite = busyStore.dialogVisible;
      }) as any;

      expect(await saveProject('demo.sledge', 'C:/work')).toBe('saved');
      expect(shownAtWrite).toBe(true);
    });

    it('stays down while the overwrite confirmation is up', async () => {
      setIOStore('loadProjectVersion', { project: CURRENT_PROJECT_VERSION - 1, sledge: '1.0.0' });
      let shownDuringConfirm = false;
      platform.dialog.confirm = vi.fn(async () => {
        shownDuringConfirm = busyStore.dialogVisible;
        return true;
      }) as any;

      expect(await saveProject('demo.sledge', 'C:/work')).toBe('saved');
      expect(shownDuringConfirm).toBe(false);
    });

    it('goes up for a browser save, which has no destination step', async () => {
      platform.core.isTauri = vi.fn(() => false) as any;
      let shownWhileAssembling = false;
      const originalCreate = URL.createObjectURL;
      URL.createObjectURL = vi.fn(() => {
        shownWhileAssembling = busyStore.dialogVisible;
        return 'blob:test';
      }) as any;

      try {
        expect(await saveProject('demo.sledge')).toBe('saved');
      } finally {
        URL.createObjectURL = originalCreate;
      }

      expect(shownWhileAssembling).toBe(true);
      expect(busyStore.dialogVisible).toBe(false);
    });
  });

  it('stays on through a destination the user then declines, and is given back after', async () => {
    setIOStore('openAs', 'new_project');
    platform.dialog.save = vi.fn(async () => {
      sample('dialog.save (open)');
      await Promise.resolve();
      sample('dialog.save (about to return null)');
      return null;
    }) as any;

    const saving = saveProject('demo.sledge');
    sample('caller, before awaiting');

    expect(await saving).toBe('cancelled');
    expect(samples.every((s) => s.busy)).toBe(true);
    expectReachedInOrder(['caller, before awaiting', 'dialog.save (open)', 'dialog.save (about to return null)']);
    // nothing was written, and the restriction is gone
    expect(platform.fs.writeFile).not.toHaveBeenCalled();
    expect(isBusy()).toBe(false);
  });
});
