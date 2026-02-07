import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Consts } from '~/Consts';
import {
  EDITOR_STATE_ERROR_FAILED_FILE_READ,
  EDITOR_STATE_ERROR_FAILED_PARSE_JSON,
  EDITOR_STATE_ERROR_FILE_NOT_FOUND,
  EDITOR_STATE_ERROR_UNKNOWN,
  loadEditorState,
} from '~/features/io/editor/load';
import { ErrorTypes } from '~/features/io/project/ProjectLoader';
import { getEditorStateStore, setAppearanceStore, setIOStore } from '~/stores/EditorStores';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { setupInMemoryTextFs } from '../../../support/inMemoryTextFs';

describe('io/editor/load (e2e)', () => {
  let platform: TestMockPlatform;
  let textFs: ReturnType<typeof setupInMemoryTextFs>;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    textFs = setupInMemoryTextFs(platform);

    setAppearanceStore('ruler', false);
    setIOStore('recentFiles', []);
    setIOStore('savedLocation', { path: undefined, name: undefined });
  });

  it('returns current editor store with FILE_NOT_FOUND when file does not exist', async () => {
    const expected = JSON.parse(JSON.stringify(getEditorStateStore()));

    const result = await loadEditorState();

    expect(result.store).toEqual(expected);
    expect(result.error).toEqual({
      type: ErrorTypes.FILE_NOT_FOUND,
      detail: EDITOR_STATE_ERROR_FILE_NOT_FOUND,
    });
  });

  it('returns current editor store when readTextFile fails', async () => {
    const expected = JSON.parse(JSON.stringify(getEditorStateStore()));
    platform.fs.exists = vi.fn(async (targetPath: string) => targetPath === Consts.editorStateFileName) as any;
    platform.fs.readTextFile = vi.fn(async () => {
      throw new Error('read failed');
    }) as any;

    const result = await loadEditorState();

    expect(result.store).toEqual(expected);
    expect(result.error?.type).toBe(ErrorTypes.INTERNAL_ERROR);
    expect(result.error?.detail).toBe(EDITOR_STATE_ERROR_FAILED_FILE_READ);
  });

  it('returns current editor store when state JSON is invalid', async () => {
    const expected = JSON.parse(JSON.stringify(getEditorStateStore()));
    textFs.files.set(`app-config:${Consts.editorStateFileName}`, '{broken-json');

    const result = await loadEditorState();

    expect(result.store).toEqual(expected);
    expect(result.error?.type).toBe(ErrorTypes.INTERNAL_ERROR);
    expect(result.error?.detail).toBe(EDITOR_STATE_ERROR_FAILED_PARSE_JSON);
  });

  it('loads and applies valid editor state JSON', async () => {
    const rawState = JSON.parse(JSON.stringify(getEditorStateStore()));
    rawState.appearanceStore.ruler = true;
    rawState.recentFiles = [{ path: 'C:/work', name: 'demo.sledge' }];
    textFs.files.set(`app-config:${Consts.editorStateFileName}`, JSON.stringify(rawState));

    const result = await loadEditorState();

    expect(result.error).toBeUndefined();
    expect(result.store.appearanceStore.ruler).toBe(true);
    expect(getEditorStateStore().appearanceStore.ruler).toBe(true);
    expect(getEditorStateStore().recentFiles).toEqual([{ path: 'C:/work', name: 'demo.sledge' }]);
  });

  it('returns UNKNOWN_ERROR when parsed JSON is null', async () => {
    textFs.files.set(`app-config:${Consts.editorStateFileName}`, 'null');

    const result = await loadEditorState();

    expect(result.error?.type).toBe(ErrorTypes.UNKNOWN_ERROR);
    expect(result.error?.detail).toBe(EDITOR_STATE_ERROR_UNKNOWN);
  });
});
