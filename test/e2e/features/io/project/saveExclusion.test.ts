import { beforeEach, describe, expect, it, vi } from 'vitest';
import { busyStore, isBusy, registerInputFinalizer, runExclusive } from '~/features/busy';
import { saveProject } from '~/features/io/project/ProjectSave';
import { markProjectChanged, markProjectSaved } from '~/features/project';
import { CURRENT_PROJECT_VERSION } from '~/features/project/Consts';
import { handleCloseRequest } from '~/routes/editor/close';
import { setIOStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../../history/helpers';

const SIZE = 8;

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * a save holds the window from the moment it is asked for until the last store it writes afterwards.
 * these pin that down at each stretch of it: choosing a destination, assembling, writing, and the state
 * updates that follow - and that it is given back however the save ends.
 */
describe('io/project/save exclusion (e2e)', () => {
  let platform: TestMockPlatform;
  const closeEvent = () => ({ preventDefault: vi.fn() });

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    platform.core.isTauri = vi.fn(() => true) as any;

    setupWebGL();
    const layers = [buildLayer('a'), buildLayer('b')];
    resetStore(layers, { width: SIZE, height: SIZE });
    registerLayers(layers, SIZE, SIZE);

    setIOStore('openAs', 'project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    setIOStore('loadProjectVersion', { project: CURRENT_PROJECT_VERSION, sledge: '1.0.0' });
    setIOStore('recentFiles', []);
    setProjectStore('project', 'lastSavedAt', undefined);
    markProjectSaved();

    platform.dialog.save = vi.fn(async () => 'C:/work/demo.sledge') as any;
    platform.dialog.confirm = vi.fn(async () => true) as any;
    platform.dialog.message = vi.fn(async () => 'Save and Quit') as any;
    platform.fs.writeFile = vi.fn(async () => undefined) as any;
    platform.fs.exists = vi.fn(async () => false) as any;
    platform.fs.mkdir = vi.fn(async () => undefined) as any;
    platform.fs.rename = vi.fn(async () => undefined) as any;
    platform.fs.remove = vi.fn(async () => undefined) as any;
    platform.path.appDataDir = vi.fn(async () => 'C:/AppData') as any;
    platform.app.getVersion = vi.fn(async () => '1.2.3') as any;
  });

  describe('while the destination is still being chosen', () => {
    it('holds the window, and lets nothing else through', async () => {
      const picked = deferred<string>();
      platform.dialog.save = vi.fn(() => picked.promise) as any;
      // "save as": no existing path, so the file dialog comes first and nothing is reported yet
      setIOStore('openAs', 'new_project');

      const saving = saveProject('demo.sledge');
      await Promise.resolve();

      expect(isBusy()).toBe(true);
      expect(busyStore.operation).toBe('save');
      // the stretch the progress stream says nothing about - a listener watching events would call this idle
      expect(busyStore.progress).toBeUndefined();

      const refused = await runExclusive('imageImport', async () => 'ran', { onRejected: () => 'refused' as const });
      expect(refused).toBe('refused');

      const event = closeEvent();
      await handleCloseRequest(event as any);
      expect(event.preventDefault).toHaveBeenCalled();
      // the refusal is reported, but the unsaved-changes prompt it would normally raise is never reached
      expect((platform.dialog.message as any).mock.calls[0][0]).toContain('Cannot quit while an operation is running');

      picked.resolve('C:/work/demo.sledge');
      await expect(saving).resolves.toBe('saved');
      expect(isBusy()).toBe(false);
    });

    it('gives the window back when the user declines', async () => {
      platform.dialog.save = vi.fn(async () => null) as any;
      setIOStore('openAs', 'new_project');

      await expect(saveProject('demo.sledge')).resolves.toBe('cancelled');

      expect(isBusy()).toBe(false);
      // and the next save goes through
      platform.dialog.save = vi.fn(async () => 'C:/work/demo.sledge') as any;
      await expect(saveProject('demo.sledge')).resolves.toBe('saved');
    });

    it('gives the window back when the dialog itself fails', async () => {
      platform.dialog.save = vi.fn(async () => {
        throw new Error('dialog unavailable');
      }) as any;
      setIOStore('openAs', 'new_project');

      // the failure is reported the way the rest of the save reports one, rather than rejecting
      await expect(saveProject('demo.sledge')).resolves.toBe('failed');
      expect(isBusy()).toBe(false);
    });
  });

  describe('while it is writing', () => {
    it('holds the window through the write and the state updates after it', async () => {
      const written = deferred();
      platform.fs.writeFile = vi.fn(() => written.promise) as any;

      const saving = saveProject('demo.sledge', 'C:/work');
      // let the read and the compression run up to the write
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(isBusy()).toBe(true);
      const refused = await runExclusive('projectLoad', async () => 'ran', { onRejected: () => 'refused' as const });
      expect(refused).toBe('refused');

      written.resolve();
      await expect(saving).resolves.toBe('saved');
      // released only after the last store this save writes - lastSavedAt among them
      expect(isBusy()).toBe(false);
      expect(projectStore.project.lastSavedAt).toBeInstanceOf(Date);
    });

    it('recovers after a write failure, and the next save succeeds', async () => {
      platform.fs.writeFile = vi.fn(async () => {
        throw new Error('disk full');
      }) as any;

      await expect(saveProject('demo.sledge', 'C:/work')).resolves.toBe('failed');
      expect(isBusy()).toBe(false);

      platform.fs.writeFile = vi.fn(async () => undefined) as any;
      await expect(saveProject('demo.sledge', 'C:/work')).resolves.toBe('saved');
    });

    it('recovers after a rename failure, and the next save succeeds', async () => {
      platform.fs.rename = vi.fn(async () => {
        throw new Error('rename failed');
      }) as any;

      await expect(saveProject('demo.sledge', 'C:/work')).resolves.toBe('failed');
      expect(isBusy()).toBe(false);

      platform.fs.rename = vi.fn(async () => undefined) as any;
      await expect(saveProject('demo.sledge', 'C:/work')).resolves.toBe('saved');
    });
  });

  describe('against the operations that are not saves', () => {
    it('cannot start while one of them is running', async () => {
      const gate = deferred();
      const importing = runExclusive('imageImport', () => gate.promise);

      await expect(saveProject('demo.sledge', 'C:/work')).resolves.toBe('failed');
      expect(platform.fs.writeFile).not.toHaveBeenCalled();

      gate.resolve();
      await importing;

      // and once it is done, the same save goes through
      await expect(saveProject('demo.sledge', 'C:/work')).resolves.toBe('saved');
    });

    it('still shares a repeat of itself aimed at the same file', async () => {
      const written = deferred();
      platform.fs.writeFile = vi.fn(() => written.promise) as any;

      const first = saveProject('demo.sledge', 'C:/work');
      const second = saveProject('demo.sledge', 'C:/work');

      written.resolve();
      await expect(Promise.all([first, second])).resolves.toEqual(['saved', 'saved']);
      // Ctrl+S held down does not write the same file twice
      expect(platform.fs.writeFile).toHaveBeenCalledTimes(1);
    });

    it('turns down a repeat aimed somewhere else', async () => {
      const written = deferred();
      platform.fs.writeFile = vi.fn(() => written.promise) as any;

      const first = saveProject('demo.sledge', 'C:/work');
      await expect(saveProject('other.sledge', 'C:/elsewhere')).resolves.toBe('failed');

      written.resolve();
      await expect(first).resolves.toBe('saved');
      expect(platform.fs.writeFile).toHaveBeenCalledTimes(1);
    });
  });

  it('settles what is still under the pointer before it reads anything', async () => {
    const order: string[] = [];
    const unregister = registerInputFinalizer(() => order.push('finalize'));
    platform.fs.writeFile = vi.fn(async () => {
      order.push('write');
    }) as any;

    try {
      await expect(saveProject('demo.sledge', 'C:/work')).resolves.toBe('saved');
    } finally {
      unregister();
    }

    // the stroke ends and its history entry is registered before the bytes are assembled, so the file and
    // the history in it describe the same moment
    expect(order).toEqual(['finalize', 'write']);
  });

  it('leaves nothing queued to run once it is done', async () => {
    const written = deferred();
    platform.fs.writeFile = vi.fn(() => written.promise) as any;

    const saving = saveProject('demo.sledge', 'C:/work');
    await new Promise((resolve) => setTimeout(resolve, 0));

    // everything turned down during the save is turned down for good - nothing is remembered and replayed
    const refusals = await Promise.all([
      runExclusive('imageImport', async () => 'ran', { onRejected: () => 'refused' as const }),
      runExclusive('clipboardPaste', async () => 'ran', { onRejected: () => 'refused' as const }),
    ]);
    expect(refusals).toEqual(['refused', 'refused']);

    written.resolve();
    await saving;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(isBusy()).toBe(false);
    expect(platform.fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('refuses a quit that arrives mid-save, without offering to discard the changes', async () => {
    const written = deferred();
    platform.fs.writeFile = vi.fn(() => written.promise) as any;
    markProjectChanged();

    const saving = saveProject('demo.sledge', 'C:/work');
    await new Promise((resolve) => setTimeout(resolve, 0));

    const event = closeEvent();
    await handleCloseRequest(event as any);

    expect(event.preventDefault).toHaveBeenCalled();
    // the refusal, not the unsaved-changes prompt: "Discard and Quit" is never on offer here
    const [text, options] = (platform.dialog.message as any).mock.calls[0];
    expect(text).toContain('Cannot quit while an operation is running');
    expect(JSON.stringify(options?.buttons ?? {})).not.toContain('Discard');

    written.resolve();
    await saving;
  });
});
