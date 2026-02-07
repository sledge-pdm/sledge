import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Consts } from '~/Consts';
import { saveEditorStateImmediate } from '~/features/io/editor/save';
import { getEditorStateStore, setAppearanceStore, setIOStore } from '~/stores/EditorStores';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { setupInMemoryTextFs } from '../../../support/inMemoryTextFs';

describe('io/editor/save (e2e)', () => {
  let platform: TestMockPlatform;
  let textFs: ReturnType<typeof setupInMemoryTextFs>;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    textFs = setupInMemoryTextFs(platform);

    setAppearanceStore('ruler', true);
    setIOStore('openAs', 'project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
  });

  it('writes current editor state to app-config using real store serialization', async () => {
    const expectedState = JSON.parse(JSON.stringify(getEditorStateStore()));

    await saveEditorStateImmediate();

    const saved = textFs.readText(Consts.editorStateFileName, { baseDir: 'app-config' });
    expect(saved).toBeDefined();
    expect(JSON.parse(saved!)).toEqual(expectedState);
    expect(textFs.dirs.has('app-config:')).toBe(true);
  });

  it('rethrows when writeTextFile fails', async () => {
    platform.fs.writeTextFile = vi.fn(async () => {
      throw new Error('write failed');
    }) as any;

    await expect(saveEditorStateImmediate()).rejects.toThrow('write failed');
  });

  it('updates only specified keys when keys are provided', async () => {
    const baseState = JSON.parse(JSON.stringify(getEditorStateStore()));
    baseState.recentFiles = [{ path: 'C:/old', name: 'old.sledge' }];
    baseState.appearanceStore.ruler = false;
    textFs.files.set(`app-config:${Consts.editorStateFileName}`, JSON.stringify(baseState));

    setIOStore('recentFiles', [{ path: 'C:/new', name: 'new.sledge' }]);
    setAppearanceStore('ruler', true);

    await saveEditorStateImmediate(['recentFiles']);

    const saved = textFs.readText(Consts.editorStateFileName, { baseDir: 'app-config' });
    expect(saved).toBeDefined();
    const parsed = JSON.parse(saved!);
    expect(parsed.recentFiles).toEqual([{ path: 'C:/new', name: 'new.sledge' }]);
    expect(parsed.appearanceStore.ruler).toBe(false);
  });
});
