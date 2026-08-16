import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRENT_PROJECT_VERSION } from '~/features/io/project/Project';
import { saveProject, saveThumbnailExternal } from '~/features/io/project/save';
import { ioStore, isProjectChanged, markProjectChanged, setIOStore } from '~/stores/EditorStores';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import { eventBus } from '~/utils/EventBus';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';

describe('io/project/save (e2e)', () => {
  let platform: TestMockPlatform;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    platform.core.isTauri = vi.fn(() => true) as any;

    setIOStore('openAs', 'new_project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    setIOStore('loadProjectVersion', { project: CURRENT_PROJECT_VERSION, sledge: '1.0.0' });
    markProjectChanged();
    setIOStore('recentFiles', []);

    setProjectStore('canvas', 'size', { width: 16, height: 16 });
    setProjectStore('layers', 'layers', []);
    setProjectStore('layers', 'state', 'activeLayerId', '');
    setProjectStore('layers', 'state', 'selected', new Set<string>());

    platform.dialog.save = vi.fn(async () => 'C:/work/demo.sledge') as any;
    platform.dialog.confirm = vi.fn(async () => true) as any;
    platform.fs.writeFile = vi.fn(async () => undefined) as any;
    platform.fs.exists = vi.fn(async () => false) as any;
    platform.fs.mkdir = vi.fn(async () => undefined) as any;
    platform.fs.rename = vi.fn(async () => undefined) as any;
    platform.fs.remove = vi.fn(async () => undefined) as any;
    platform.path.appDataDir = vi.fn(async () => 'C:/AppData') as any;
    platform.app.getVersion = vi.fn(async () => '1.2.3') as any;
  });

  it('returns false and emits cancel event when save dialog is cancelled', async () => {
    const emit = vi.spyOn(eventBus, 'emit');
    platform.dialog.save = vi.fn(async () => null) as any;

    const result = await saveProject('new project.sledge');

    expect(result).toBe(false);
    expect(emit).toHaveBeenCalledWith('project:saveCancelled', {});
  });

  it('aborts overwrite when outdated project confirmation is rejected', async () => {
    setIOStore('openAs', 'project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    setIOStore('loadProjectVersion', { project: CURRENT_PROJECT_VERSION - 1, sledge: '1.0.0' });
    platform.dialog.confirm = vi.fn(async () => false) as any;

    const result = await saveProject('demo.sledge', 'C:/work');

    expect(result).toBe(false);
    expect(platform.dialog.confirm).toHaveBeenCalledTimes(1);
    expect(platform.fs.writeFile).not.toHaveBeenCalled();
  });

  it('writes project and updates state when save succeeds', async () => {
    const emit = vi.spyOn(eventBus, 'emit');
    setIOStore('openAs', 'project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    setIOStore('loadProjectVersion', { project: CURRENT_PROJECT_VERSION, sledge: '1.0.0' });

    const result = await saveProject('demo.sledge', 'C:/work');

    expect(result).toBe(true);
    // the project is written to a temp file and renamed into place, so an interrupted save cannot
    // leave a half-written .sledge behind
    expect(platform.fs.writeFile).toHaveBeenCalledTimes(1);
    expect((platform.fs.writeFile as any).mock.calls[0][0]).toBe('C:/work/demo.sledge.saving');
    expect((platform.fs.writeFile as any).mock.calls[0][1]).toBeInstanceOf(Uint8Array);
    expect(platform.fs.rename).toHaveBeenCalledWith('C:/work/demo.sledge.saving', 'C:/work/demo.sledge');
    expect(platform.fs.remove).not.toHaveBeenCalled();
    expect(ioStore.openAs).toBe('project');
    expect(ioStore.savedLocation).toEqual({ path: 'C:/work', name: 'demo.sledge' });
    expect(isProjectChanged()).toBe(false);
    expect(ioStore.loadProjectVersion).toEqual({
      sledge: '1.2.3',
      project: CURRENT_PROJECT_VERSION,
    });
    expect(emit).toHaveBeenCalledWith('project:saved', {
      location: { path: 'C:/work', name: 'demo.sledge' },
    });
  });

  it('returns false and emits failure event when file write fails', async () => {
    const emit = vi.spyOn(eventBus, 'emit');
    platform.fs.writeFile = vi.fn(async () => {
      throw new Error('disk full');
    }) as any;

    const result = await saveProject('demo.sledge', 'C:/work');

    expect(result).toBe(false);
    expect(emit).toHaveBeenCalledWith('project:saveFailed', {
      error: expect.any(Error),
    });
  });

  it('cleans up the temp file and fails when the rename does not go through', async () => {
    const emit = vi.spyOn(eventBus, 'emit');
    platform.fs.rename = vi.fn(async () => {
      throw new Error('rename failed');
    }) as any;

    const result = await saveProject('demo.sledge', 'C:/work');

    expect(result).toBe(false);
    // the existing .sledge is still whatever it was, so the half-written temp file must not be left around
    expect(platform.fs.remove).toHaveBeenCalledWith('C:/work/demo.sledge.saving');
    expect(emit).toHaveBeenCalledWith('project:saveFailed', {
      error: expect.any(Error),
    });
  });

  it('stays unsaved when a change lands while the save is running', async () => {
    setIOStore('openAs', 'project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    // the drawing that arrives mid-save is not in the bytes being written, so completing the write
    // must not report the project as saved
    platform.fs.writeFile = vi.fn(async () => {
      markProjectChanged();
    }) as any;

    const result = await saveProject('demo.sledge', 'C:/work');

    expect(result).toBe(true);
    expect(isProjectChanged()).toBe(true);
  });

  it('stays unsaved when the write fails', async () => {
    setIOStore('openAs', 'project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    platform.fs.writeFile = vi.fn(async () => {
      throw new Error('disk full');
    }) as any;

    const result = await saveProject('demo.sledge', 'C:/work');

    expect(result).toBe(false);
    expect(isProjectChanged()).toBe(true);
  });

  it('saveThumbnailExternal creates thumbnail dir and writes png bytes', async () => {
    const result = await saveThumbnailExternal('file-123', 'data:image/png;base64,AAAA');

    expect(platform.fs.exists).toHaveBeenCalledWith('C:/AppData/thumbnails');
    expect(platform.fs.mkdir).toHaveBeenCalledWith('C:/AppData/thumbnails', { recursive: true });
    expect(platform.fs.writeFile).toHaveBeenCalledWith('C:/AppData/thumbnails/file-123.png', expect.any(Uint8Array));
    expect(result).toBe('C:/AppData/thumbnails/file-123.png');
  });
});
