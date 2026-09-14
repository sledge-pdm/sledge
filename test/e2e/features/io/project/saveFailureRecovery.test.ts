import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isBusy } from '~/features/busy';
import { saveProject } from '~/features/io/project/ProjectSave';
import { CURRENT_PROJECT_VERSION } from '~/features/project/Consts';
import { setIOStore } from '~/stores/EditorStores';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../../history/helpers';

const SIZE = 8;

/**
 * the two stretches a save can fail in that are not a file operation: reading the snapshot bodies back out
 * of the existing file, and compressing the layers. both hold the window while they run, so both have to
 * give it back - and leave the editor able to save again - when they fail.
 */
const compression = vi.hoisted(() => ({
  failOnce: false,
}));

vi.mock('~/utils/Compression', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/utils/Compression')>();
  return {
    ...original,
    deflateAllAsync: vi.fn(async (...args: Parameters<typeof original.deflateAllAsync>) => {
      if (compression.failOnce) {
        compression.failOnce = false;
        throw new Error('compression failed');
      }
      return await original.deflateAllAsync(...args);
    }),
  };
});

describe('io/project/save recovery after a failure (e2e)', () => {
  let platform: TestMockPlatform;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    platform.core.isTauri = vi.fn(() => true) as any;
    compression.failOnce = false;

    setupWebGL();
    const layers = [buildLayer('a'), buildLayer('b')];
    resetStore(layers, { width: SIZE, height: SIZE });
    registerLayers(layers, SIZE, SIZE);

    setIOStore('openAs', 'project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    setIOStore('loadProjectVersion', { project: CURRENT_PROJECT_VERSION, sledge: '1.0.0' });
    setIOStore('recentFiles', []);
    setProjectStore('snapshots', []);

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

  it('recovers after the snapshot readback fails', async () => {
    // the body of this snapshot lives only in the file this save would overwrite, so a failed read has to
    // fail the save rather than quietly write a file without it
    setProjectStore('snapshots', [{ id: 's1', name: 'snap', description: undefined, createdAt: 0, project: undefined }]);
    platform.fs.readFile = vi.fn(async () => {
      throw new Error('read failed');
    }) as any;

    await expect(saveProject('demo.sledge', 'C:/work')).resolves.toBe('failed');
    expect(platform.fs.writeFile).not.toHaveBeenCalled();
    expect(isBusy()).toBe(false);

    // the editor is usable again, and a save that can read succeeds
    setProjectStore('snapshots', []);
    await expect(saveProject('demo.sledge', 'C:/work')).resolves.toBe('saved');
    expect(platform.fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('recovers after the compression fails', async () => {
    compression.failOnce = true;

    await expect(saveProject('demo.sledge', 'C:/work')).resolves.toBe('failed');
    // the failure came before any bytes existed, so nothing was written over the existing project
    expect(platform.fs.writeFile).not.toHaveBeenCalled();
    expect(isBusy()).toBe(false);

    await expect(saveProject('demo.sledge', 'C:/work')).resolves.toBe('saved');
    expect(platform.fs.writeFile).toHaveBeenCalledTimes(1);
  });
});
