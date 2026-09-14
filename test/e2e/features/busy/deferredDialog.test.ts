import { beforeEach, describe, expect, it, vi } from 'vitest';
import { busyStore, isBusy } from '~/features/busy';
import { importImagesFromDialog } from '~/features/image_pool';
import { markProjectChanged, markProjectSaved } from '~/features/project';
import { CURRENT_PROJECT_VERSION } from '~/features/project/Consts';
import { deleteSnapshot, loadSnapshot, registerCurrentProjectSnapshot } from '~/features/snapshot';
import { handleCloseRequest } from '~/routes/editor/close';
import { setIOStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../history/helpers';

const SIZE = 4;

/** a real 1x1 PNG, so the import decodes an actual image rather than a stub. */
const ONE_PIXEL_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const pngBytes = () => Uint8Array.from(atob(ONE_PIXEL_PNG), (c) => c.charCodeAt(0));

/**
 * an operation that opens a native dialog before it does anything holds the window from the moment it is
 * asked for, but has nothing worth covering the window for until that dialog is answered - the OS dialog is
 * modal to this window anyway. these pin down, for each such operation, that the modal waits for the answer
 * and that backing out never raises one at all.
 */
describe('features/busy deferred modal (e2e)', () => {
  let platform: TestMockPlatform;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    platform.core.isTauri = vi.fn(() => true) as any;

    setupWebGL();
    const layers = [buildLayer('a')];
    resetStore(layers, { width: SIZE, height: SIZE });
    registerLayers([layers[0]], SIZE, SIZE);
    setProjectStore('snapshots', []);
    setProjectStore('imagePool', 'entries', []);

    setIOStore('openAs', 'project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    setIOStore('loadProjectVersion', { project: CURRENT_PROJECT_VERSION, sledge: '1.0.0' });
    platform.app.getVersion = vi.fn(async () => '1.2.3') as any;
    platform.path.appDataDir = vi.fn(async () => 'C:/AppData') as any;
    markProjectSaved();
  });

  describe('the image import picker', () => {
    it('leaves the modal down while the picker is open, then raises it', async () => {
      let visibleDuringPicker: boolean | undefined;
      let restrictedDuringPicker: boolean | undefined;
      let visibleAtRead: boolean | undefined;
      platform.dialog.open = vi.fn(async () => {
        visibleDuringPicker = busyStore.dialogVisible;
        restrictedDuringPicker = isBusy();
        return ['C:/pictures/a.png'];
      }) as any;
      platform.fs.readFile = vi.fn(async () => {
        visibleAtRead = busyStore.dialogVisible;
        return pngBytes();
      }) as any;

      await importImagesFromDialog();

      expect(visibleDuringPicker).toBe(false);
      // the restriction was on the whole time - only the cover waited
      expect(restrictedDuringPicker).toBe(true);
      expect(visibleAtRead).toBe(true);
      expect(projectStore.imagePool.entries).toHaveLength(1);
      expect(busyStore.dialogVisible).toBe(false);
    });

    it('never raises it when the picker is cancelled', async () => {
      let visibleDuringPicker: boolean | undefined;
      platform.dialog.open = vi.fn(async () => {
        visibleDuringPicker = busyStore.dialogVisible;
        return null;
      }) as any;
      platform.fs.readFile = vi.fn(async () => pngBytes()) as any;

      await importImagesFromDialog();

      expect(visibleDuringPicker).toBe(false);
      expect(platform.fs.readFile).not.toHaveBeenCalled();
      expect(projectStore.imagePool.entries).toHaveLength(0);
      expect(busyStore.dialogVisible).toBe(false);
    });
  });

  describe('the snapshot delete confirmation', () => {
    const snapshot = () => ({ id: 's1', name: 'snap', description: undefined, createdAt: 0, project: undefined });

    it('leaves the modal down while the confirmation is up', async () => {
      setProjectStore('snapshots', [snapshot()]);
      let visibleDuringConfirm: boolean | undefined;
      let restrictedDuringConfirm: boolean | undefined;
      platform.dialog.confirm = vi.fn(async () => {
        visibleDuringConfirm = busyStore.dialogVisible;
        restrictedDuringConfirm = isBusy();
        return true;
      }) as any;

      await deleteSnapshot(projectStore.snapshots[0]);

      expect(visibleDuringConfirm).toBe(false);
      expect(restrictedDuringConfirm).toBe(true);
      expect(projectStore.snapshots).toHaveLength(0);
      expect(busyStore.dialogVisible).toBe(false);
    });

    it('never raises it when the delete is cancelled', async () => {
      setProjectStore('snapshots', [snapshot()]);
      platform.dialog.confirm = vi.fn(async () => {
        expect(busyStore.dialogVisible).toBe(false);
        return false;
      }) as any;

      await deleteSnapshot(projectStore.snapshots[0]);

      expect(projectStore.snapshots).toHaveLength(1);
      expect(busyStore.dialogVisible).toBe(false);
    });
  });

  describe('the snapshot restore confirmation', () => {
    it('leaves the modal down while the confirmation is up', async () => {
      await registerCurrentProjectSnapshot('restore me');
      let visibleDuringConfirm: boolean | undefined;
      platform.dialog.confirm = vi.fn(async () => {
        visibleDuringConfirm = busyStore.dialogVisible;
        return true;
      }) as any;

      await loadSnapshot(projectStore.snapshots[0]);

      expect(visibleDuringConfirm).toBe(false);
      expect(busyStore.dialogVisible).toBe(false);
    });

    it('never raises it when the restore is cancelled', async () => {
      await registerCurrentProjectSnapshot('restore me');
      const before = projectStore.snapshots.length;
      platform.dialog.confirm = vi.fn(async () => {
        expect(busyStore.dialogVisible).toBe(false);
        return false;
      }) as any;

      await loadSnapshot(projectStore.snapshots[0]);

      expect(projectStore.snapshots).toHaveLength(before);
      expect(busyStore.dialogVisible).toBe(false);
    });

    it('raises it straight away when a backup is taken instead of asking', async () => {
      await registerCurrentProjectSnapshot('restore me');
      platform.dialog.confirm = vi.fn(async () => true) as any;
      let visibleWhileBackingUp: boolean | undefined;
      const originalGetVersion = platform.app.getVersion;
      platform.app.getVersion = vi.fn(async () => {
        visibleWhileBackingUp ??= busyStore.dialogVisible;
        return await (originalGetVersion as any)();
      }) as any;

      await loadSnapshot(projectStore.snapshots[0], { backup: true });

      // nothing is asked on this path, and assembling the backup is already the work
      expect(visibleWhileBackingUp).toBe(true);
      expect(platform.dialog.confirm).not.toHaveBeenCalled();
      expect(busyStore.dialogVisible).toBe(false);
    });
  });

  describe('the unsaved-changes prompt on quit', () => {
    const closeEvent = () => ({ preventDefault: vi.fn() });

    beforeEach(() => {
      markProjectChanged();
      platform.dialog.save = vi.fn(async () => 'C:/work/demo.sledge') as any;
      platform.fs.writeFile = vi.fn(async () => undefined) as any;
      platform.fs.rename = vi.fn(async () => undefined) as any;
      platform.fs.exists = vi.fn(async () => false) as any;
      platform.fs.mkdir = vi.fn(async () => undefined) as any;
      platform.fs.remove = vi.fn(async () => undefined) as any;
    });

    it('leaves the modal down while the prompt is up, and raises it for the save', async () => {
      let visibleDuringPrompt: boolean | undefined;
      let restrictedDuringPrompt: boolean | undefined;
      let visibleAtWrite: boolean | undefined;
      platform.dialog.message = vi.fn(async () => {
        visibleDuringPrompt = busyStore.dialogVisible;
        restrictedDuringPrompt = isBusy();
        return 'Save and Quit';
      }) as any;
      platform.fs.writeFile = vi.fn(async () => {
        visibleAtWrite = busyStore.dialogVisible;
        markProjectSaved();
      }) as any;

      await handleCloseRequest(closeEvent() as any);

      expect(visibleDuringPrompt).toBe(false);
      expect(restrictedDuringPrompt).toBe(true);
      expect(visibleAtWrite).toBe(true);
      expect(busyStore.dialogVisible).toBe(false);
    });

    it('never raises it when the quit is cancelled', async () => {
      platform.dialog.message = vi.fn(async () => {
        expect(busyStore.dialogVisible).toBe(false);
        return 'Cancel';
      }) as any;
      const event = closeEvent();

      await handleCloseRequest(event as any);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(busyStore.dialogVisible).toBe(false);
    });

    it('reports a failed save once the window is free again', async () => {
      const messages: { text: string; visible: boolean; restricted: boolean }[] = [];
      platform.dialog.message = vi.fn(async (text: string) => {
        messages.push({ text, visible: busyStore.dialogVisible, restricted: isBusy() });
        return 'Save and Quit';
      }) as any;
      // the write succeeds, but an edit lands while it runs, so the revision it marks saved is already
      // behind and the project comes out of the save still dirty - the existing "save failed" path
      platform.fs.writeFile = vi.fn(async () => {
        markProjectChanged();
      }) as any;
      const event = closeEvent();

      await handleCloseRequest(event as any);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(messages).toHaveLength(2);
      // the failure is told after the operation is over, rather than behind our own modal
      expect(messages[1].text).toContain('Save failed');
      expect(messages[1].visible).toBe(false);
      expect(messages[1].restricted).toBe(false);
    });
  });
});
