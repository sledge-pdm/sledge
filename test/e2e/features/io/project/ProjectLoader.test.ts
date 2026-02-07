import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRENT_PROJECT_VERSION } from '~/features/io/project/Project';
import { ErrorTypes, ProjectLoader } from '~/features/io/project/ProjectLoader';
import { ioStore, setIOStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';

describe('io/project/ProjectLoader (e2e)', () => {
  let platform: TestMockPlatform;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);

    setIOStore('openAs', 'new_project');
    setIOStore('savedLocation', { path: undefined, name: undefined });
    setIOStore('recentFiles', []);
    setIOStore('isProjectChangedAfterSave', true);

    setProjectStore('canvas', 'size', { width: 16, height: 16 });
    setProjectStore('layers', 'layers', []);
    setProjectStore('layers', 'state', 'activeLayerId', '');
    setProjectStore('layers', 'state', 'selected', new Set<string>());

    platform.fs.exists = vi.fn(async () => true) as any;
    platform.app.getVersion = vi.fn(async () => '1.0.0') as any;
  });

  it('fromNew initializes project metadata', async () => {
    const result = await ProjectLoader.fromNew({ width: 32, height: 24 }).load();

    expect(result).toEqual({ ok: true, type: 'new' });
    expect(ioStore.openAs).toBe('new_project');
    expect(ioStore.loadProjectVersion).toEqual({
      project: CURRENT_PROJECT_VERSION,
      sledge: '1.0.0',
    });
    expect(ioStore.isProjectChangedAfterSave).toBe(false);
    expect(projectStore.canvas.size).toEqual({ width: 32, height: 24 });
    expect(projectStore.layers.layers).toHaveLength(1);
  });

  it('fromPath returns FILE_NOT_FOUND when target path does not exist', async () => {
    platform.fs.exists = vi.fn(async () => false) as any;

    const result = await ProjectLoader.fromPath({ path: 'C:/work/missing.sledge' }).load();

    expect(result.ok).toBe(false);
    expect(result.type).toBe('path');
    expect(result.error?.type).toBe(ErrorTypes.FILE_NOT_FOUND);
    expect(result.path).toBe('C:/work/missing.sledge');
  });

  it('fromClipboard returns FAILED_LOAD_RUNTIME when clipboard image is unavailable', async () => {
    platform.clipboard.readImage = vi.fn(async () => {
      throw new Error('clipboard read failed');
    }) as any;

    const result = await ProjectLoader.fromClipboard({ name: 'clip' }).load();

    expect(result.ok).toBe(false);
    expect(result.type).toBe('clipboard');
    expect(result.error?.type).toBe(ErrorTypes.FAILED_LOAD_RUNTIME);
    expect(result.error?.detail).toContain('clipboard');
  });
});
