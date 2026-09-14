import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelSave, isSaveCancellable, saveProject } from '~/features/io/project/ProjectSave';
import { isProjectChanged, markProjectChanged } from '~/features/project';
import { CURRENT_PROJECT_VERSION } from '~/features/project/Consts';
import { ioStore, setIOStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../../history/helpers';

const SIZE = 8;

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/**
 * a save can be given up on while it is still reading and compressing - nothing has been written yet. once
 * it starts writing it cannot: the bytes go out in one call that no signal interrupts, so the file is going
 * to exist either way. accepting a cancel then would only throw away the bookkeeping that records the write,
 * leaving the editor pointing at the old file while the new one sits on disk.
 */
describe('io/project/save cancellation window (e2e)', () => {
  let platform: TestMockPlatform;

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
    setProjectStore('snapshots', []);
    setProjectStore('project', 'lastSavedAt', undefined);
    markProjectChanged();

    platform.dialog.save = vi.fn(async () => 'C:/work/demo.sledge') as any;
    platform.dialog.confirm = vi.fn(async () => true) as any;
    platform.fs.writeFile = vi.fn(async () => undefined) as any;
    platform.fs.rename = vi.fn(async () => undefined) as any;
    platform.fs.exists = vi.fn(async () => false) as any;
    platform.fs.mkdir = vi.fn(async () => undefined) as any;
    platform.fs.remove = vi.fn(async () => undefined) as any;
    platform.path.appDataDir = vi.fn(async () => 'C:/AppData') as any;
    platform.app.getVersion = vi.fn(async () => '1.2.3') as any;
  });

  it('is not cancellable when no save is running', () => {
    expect(isSaveCancellable()).toBe(false);
    expect(cancelSave()).toBe(false);
  });

  it('takes a cancel while it is still assembling, and writes nothing', async () => {
    const reading = deferred<Uint8Array>();
    platform.app.getVersion = vi.fn(async () => {
      // held here the save is still before its write
      await reading.promise;
      return '1.2.3';
    }) as any;

    const saving = saveProject('demo.sledge', 'C:/work');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(isSaveCancellable()).toBe(true);
    expect(cancelSave()).toBe(true);

    reading.resolve(new Uint8Array());
    await expect(saving).resolves.toBe('cancelled');
    expect(platform.fs.writeFile).not.toHaveBeenCalled();
    expect(isProjectChanged()).toBe(true);
  });

  it('turns a cancel down once the write has started', async () => {
    const written = deferred();
    let cancelDuringWrite: boolean | undefined;
    let cancellableDuringWrite: boolean | undefined;
    platform.fs.writeFile = vi.fn(async () => {
      cancellableDuringWrite = isSaveCancellable();
      cancelDuringWrite = cancelSave();
      await written.promise;
    }) as any;

    const saving = saveProject('demo.sledge', 'C:/work');
    await new Promise((resolve) => setTimeout(resolve, 0));
    written.resolve();

    // the refused cancel does not derail the save: it reports success, as it should
    await expect(saving).resolves.toBe('saved');
    expect(cancellableDuringWrite).toBe(false);
    expect(cancelDuringWrite).toBe(false);
  });

  it('records the write it did, rather than leaving the editor pointing at the old file', async () => {
    // the bug this rule exists for: a cancel during the write used to skip everything below it
    platform.fs.writeFile = vi.fn(async () => {
      cancelSave();
    }) as any;

    await expect(saveProject('demo.sledge', 'C:/work')).resolves.toBe('saved');

    expect(platform.fs.rename).toHaveBeenCalledWith('C:/work/demo.sledge.saving', 'C:/work/demo.sledge');
    expect(isProjectChanged()).toBe(false);
    expect(ioStore.savedLocation).toEqual({ path: 'C:/work', name: 'demo.sledge' });
    expect(projectStore.project.lastSavedAt).toBeInstanceOf(Date);
    expect(ioStore.recentFiles.length).toBeGreaterThan(0);
  });

  it('keeps a "save as" destination that was written despite the cancel', async () => {
    setIOStore('openAs', 'new_project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'old.sledge' });
    platform.dialog.save = vi.fn(async () => 'C:/elsewhere/new.sledge') as any;
    platform.fs.writeFile = vi.fn(async () => {
      cancelSave();
    }) as any;

    await expect(saveProject('old.sledge')).resolves.toBe('saved');

    // the editor follows the file it actually wrote, so the next Ctrl+S does not go back to the old one
    expect(ioStore.savedLocation).toEqual({ path: 'C:/elsewhere', name: 'new.sledge' });
  });

  it('lets the next save be cancelled again', async () => {
    platform.fs.writeFile = vi.fn(async () => {
      cancelSave();
    }) as any;
    await expect(saveProject('demo.sledge', 'C:/work')).resolves.toBe('saved');

    // the flag is per-save, not sticky
    expect(isSaveCancellable()).toBe(false);

    const reading = deferred<void>();
    platform.app.getVersion = vi.fn(async () => {
      await reading.promise;
      return '1.2.3';
    }) as any;
    markProjectChanged();
    const saving = saveProject('demo.sledge', 'C:/work');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(isSaveCancellable()).toBe(true);
    expect(cancelSave()).toBe(true);

    reading.resolve();
    await expect(saving).resolves.toBe('cancelled');
  });
});
