import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDefaultGlobalConfig } from '~/config/GlobalConfig';
import { InitialLoadTypes } from '~/routes/editor/load';
import {
  ERROR_CLIPBOARD_IMAGE_FAILED,
  ERROR_LAST_PROJECT_FAILED_NEW_FAILED,
  ERROR_LAST_PROJECT_FAILED_OPENED_NEW,
  ERROR_LAST_PROJECT_NOT_FOUND_OPENED_NEW,
  ERROR_NEW_PROJECT,
  formatLoadErrorMessage,
} from '~/routes/editor/loadError';
import type { EditorStateStore } from '~/stores/EditorStores';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';

vi.mock('~/features/canvas', () => ({
  changeCanvasSize: vi.fn(),
  adjustZoomToFit: vi.fn(),
}));

vi.mock('~/features/layer', () => ({
  addLayer: vi.fn(),
}));

vi.mock('~/stores/RuntimeProject', () => ({
  initRuntimeProject: vi.fn(),
}));

const setWindowContext = (options: { search?: string; openPath?: string }) => {
  (globalThis as any).window = {
    location: {
      search: options.search ?? '',
    },
    __PATH__: options.openPath,
  };
};

const createPlatformMock = () => {
  const platform = new TestMockPlatform();
  const dialogMessages: Array<{ message: string; options?: Record<string, unknown> }> = [];
  const message = vi.fn(async (msg: string, options?: Record<string, unknown>) => {
    dialogMessages.push({ message: msg, options });
    return 'ok';
  });
  platform.dialog.message = message as any;

  const close = vi.fn(async () => {});
  const destroy = vi.fn(async () => {});
  platform.window.getCurrentWindow = () => ({ close, destroy }) as any;

  setPlatform(platform);
  return { platform, dialogMessages, message, close, destroy };
};

const mockLayerSuccess = async () => {
  const LayerService = await import('~/features/layer');
  vi.spyOn(LayerService, 'addLayer').mockImplementation(() => ({}) as any);
};

const mockCanvasSuccess = async () => {
  const CanvasService = await import('~/features/canvas');
  vi.spyOn(CanvasService, 'changeCanvasSize').mockImplementation((_newSize, _options) => true);
};

const mockCanvasFailure = async (error: Error) => {
  const CanvasService = await import('~/features/canvas');
  vi.spyOn(CanvasService, 'changeCanvasSize').mockImplementation(() => {
    throw error;
  });
};

const mockUnpackFromPathFailure = async (error: Error) => {
  const Msgpackr = await import('~/utils/msgpackr');
  vi.spyOn(Msgpackr, 'unpackFromPath').mockRejectedValue(error);
};

const mockLoadLocalImageFailure = async (error: Error) => {
  const DataUtils = await import('~/utils/DataUtils');
  vi.spyOn(DataUtils, 'loadLocalImage').mockRejectedValue(error);
};

const mockClipboardReadImageFailure = async (platform: TestMockPlatform, error: Error) => {
  platform.clipboard.readImage = vi.fn(async () => {
    throw error;
  }) as any;
};

const initInitialLoad = async (editorState?: EditorStateStore) => {
  const { ProjectLoader } = await import('~/features/io/project/ProjectLoader');
  const { getInitialLoader, InitialLoadTypes } = await import('~/routes/editor/load');
  const { reportInitialLoadError } = await import('~/routes/editor/loadError');
  const PATH_PROJECT_TYPES = new Set<InitialLoadTypes>([
    InitialLoadTypes.PATH_PROJECT,
    InitialLoadTypes.PATH_PROJECT_LAST,
    InitialLoadTypes.PATH_IMAGE_PROJECT,
    InitialLoadTypes.PATH_IMAGE_PROJECT_LAST,
  ]);
  const { initialLoadType, loader, fatalError, targetPath } = await getInitialLoader(editorState as EditorStateStore);
  if (!loader) {
    await reportInitialLoadError(initialLoadType, fatalError, undefined, targetPath);
    return { initialLoadType, targetPath, ok: false };
  }

  const result = await loader.load();
  if (result.ok) {
    return { initialLoadType, targetPath, ok: true };
  }

  if (PATH_PROJECT_TYPES.has(initialLoadType)) {
    const fallbackResult = await ProjectLoader.fromNew({ ...globalConfig.default.canvasSize }).load();
    if (fallbackResult.ok) {
      await reportInitialLoadError(initialLoadType, result.error, undefined, targetPath);
      return { initialLoadType, targetPath, ok: false, fallbackOk: true };
    }
    await reportInitialLoadError(InitialLoadTypes.NEW_PROJECT_FALLBACK, result.error, initialLoadType, targetPath);
    return { initialLoadType, targetPath, ok: false, fallbackOk: false };
  }

  await reportInitialLoadError(initialLoadType, result.error, undefined, targetPath);
  return { initialLoadType, targetPath, ok: false };
};

beforeEach(() => {
  setWindowContext({ search: '', openPath: undefined });
  setGlobalConfig(makeDefaultGlobalConfig());
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (globalThis as any).window;
});

describe('initial load error handling', () => {
  const MISSING_PROJECT_PATH = 'C:/missing.sledge';
  const BROKEN_PROJECT_PATH = 'C:/broken.sledge';
  const IMAGE_PROJECT_PATH = 'C:/image.png';
  const MISSING_IMAGE_PATH = 'C:/missing.png';

  it('(x)CONFIG', async () => {
    const { platform } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    platform.fs.readTextFile = vi.fn(async () => '{broken-json') as any;

    const { loadGlobalSettings } = await import('~/features/io/config/load');
    const result = await loadGlobalSettings();
    expect(result.globalConfigStore.default.open).toBe('last');
  });

  it('(x)EDITOR_STATE', async () => {
    const { platform } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    platform.fs.readTextFile = vi.fn(async () => '{broken-json') as any;

    const { loadEditorState } = await import('~/features/io/editor/load');
    const result = await loadEditorState();
    expect(result).toBeUndefined();
  });

  it('(!)PROJECT -> (o)NEW', async () => {
    const { platform, dialogMessages, close, destroy } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => false) as any;

    setWindowContext({ openPath: MISSING_PROJECT_PATH });
    await mockLayerSuccess();
    await mockCanvasSuccess();

    await initInitialLoad();

    expect(dialogMessages[0]?.message).toBe(formatLoadErrorMessage(ERROR_LAST_PROJECT_NOT_FOUND_OPENED_NEW, MISSING_PROJECT_PATH));
    expect(close).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();
  });

  it('(!)PROJECT -> (x)NEW', async () => {
    const { platform, dialogMessages, close, destroy } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => false) as any;

    setWindowContext({ openPath: MISSING_PROJECT_PATH });
    await mockLayerSuccess();
    await mockCanvasFailure(new Error('canvas fail'));

    await initInitialLoad();

    expect(dialogMessages[0]?.message).toBe(formatLoadErrorMessage(ERROR_LAST_PROJECT_NOT_FOUND_OPENED_NEW, MISSING_PROJECT_PATH));
    expect(close).toHaveBeenCalled();
    expect(destroy).toHaveBeenCalled();
  });

  it('(x)PROJECT -> (o)NEW', async () => {
    const { platform, dialogMessages } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    await mockUnpackFromPathFailure(new Error('boom'));
    await mockLayerSuccess();
    await mockCanvasSuccess();

    setWindowContext({ openPath: BROKEN_PROJECT_PATH });
    await initInitialLoad();

    expect(dialogMessages[0]?.message).toBe(formatLoadErrorMessage(ERROR_LAST_PROJECT_FAILED_OPENED_NEW, BROKEN_PROJECT_PATH));
  });

  it('(x)PROJECT -> (x)NEW', async () => {
    const { platform, dialogMessages, close, destroy } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    await mockUnpackFromPathFailure(new Error('boom'));
    await mockLayerSuccess();
    await mockCanvasFailure(new Error('canvas fail'));

    setWindowContext({ openPath: BROKEN_PROJECT_PATH });
    await initInitialLoad();

    expect(dialogMessages[0]?.message).toBe(formatLoadErrorMessage(ERROR_LAST_PROJECT_FAILED_NEW_FAILED, BROKEN_PROJECT_PATH));
    expect(close).toHaveBeenCalled();
    expect(destroy).toHaveBeenCalled();
  });

  it('(x)CONFIG -> ... -> (x)PROJECT', async () => {
    const { platform, dialogMessages, close, destroy } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    platform.fs.readTextFile = vi.fn(async () => '{broken-json') as any;
    await mockUnpackFromPathFailure(new Error('boom'));
    await mockLayerSuccess();
    await mockCanvasFailure(new Error('canvas fail'));

    const { loadGlobalSettings } = await import('~/features/io/config/load');
    await loadGlobalSettings();

    setWindowContext({ openPath: BROKEN_PROJECT_PATH });
    await initInitialLoad();

    expect(dialogMessages).toHaveLength(1);
    expect(dialogMessages[0]?.message).toBe(formatLoadErrorMessage(ERROR_LAST_PROJECT_FAILED_NEW_FAILED, BROKEN_PROJECT_PATH));
    expect(close).toHaveBeenCalled();
    expect(destroy).toHaveBeenCalled();
  });

  it('(x)EDITOR_STATE -> ... -> (x)PROJECT', async () => {
    const { platform, dialogMessages, close, destroy } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    platform.fs.readTextFile = vi.fn(async () => '{broken-json') as any;
    await mockUnpackFromPathFailure(new Error('boom'));
    await mockLayerSuccess();
    await mockCanvasFailure(new Error('canvas fail'));

    const { loadEditorState } = await import('~/features/io/editor/load');
    await loadEditorState();

    setWindowContext({ openPath: BROKEN_PROJECT_PATH });
    await initInitialLoad();

    expect(dialogMessages).toHaveLength(1);
    expect(dialogMessages[0]?.message).toBe(formatLoadErrorMessage(ERROR_LAST_PROJECT_FAILED_NEW_FAILED, BROKEN_PROJECT_PATH));
    expect(close).toHaveBeenCalled();
    expect(destroy).toHaveBeenCalled();
  });

  it('(x)IMG_PROJECT -> (o)NEW', async () => {
    const { platform, dialogMessages } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    await mockLoadLocalImageFailure(new Error('image read failed'));
    await mockLayerSuccess();
    await mockCanvasSuccess();

    setWindowContext({ openPath: IMAGE_PROJECT_PATH });
    await initInitialLoad();

    expect(dialogMessages[0]?.message).toBe(formatLoadErrorMessage(ERROR_LAST_PROJECT_FAILED_OPENED_NEW, IMAGE_PROJECT_PATH));
  });

  it('(!)IMG_PROJECT -> (o)NEW', async () => {
    const { platform, dialogMessages, close, destroy } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => false) as any;
    await mockLayerSuccess();
    await mockCanvasSuccess();

    setWindowContext({ openPath: MISSING_IMAGE_PATH });
    await initInitialLoad();

    expect(dialogMessages[0]?.message).toBe(formatLoadErrorMessage(ERROR_LAST_PROJECT_NOT_FOUND_OPENED_NEW, MISSING_IMAGE_PATH));
    expect(close).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();
  });

  it('(!)IMG_PROJECT -> (x)NEW', async () => {
    const { platform, dialogMessages, close, destroy } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => false) as any;
    await mockLayerSuccess();
    await mockCanvasFailure(new Error('canvas fail'));

    setWindowContext({ openPath: MISSING_IMAGE_PATH });
    await initInitialLoad();

    expect(dialogMessages[0]?.message).toBe(formatLoadErrorMessage(ERROR_LAST_PROJECT_NOT_FOUND_OPENED_NEW, MISSING_IMAGE_PATH));
    expect(close).toHaveBeenCalled();
    expect(destroy).toHaveBeenCalled();
  });

  it('(x)IMG_PROJECT -> (x)NEW', async () => {
    const { platform, dialogMessages, close, destroy } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    await mockLoadLocalImageFailure(new Error('image read failed'));
    await mockLayerSuccess();
    await mockCanvasFailure(new Error('canvas fail'));

    setWindowContext({ openPath: IMAGE_PROJECT_PATH });
    await initInitialLoad();

    expect(dialogMessages[0]?.message).toBe(formatLoadErrorMessage(ERROR_LAST_PROJECT_FAILED_NEW_FAILED, IMAGE_PROJECT_PATH));
    expect(close).toHaveBeenCalled();
    expect(destroy).toHaveBeenCalled();
  });

  it('(x)NEW', async () => {
    const { dialogMessages, close, destroy } = createPlatformMock();
    await mockLayerSuccess();
    await mockCanvasFailure(new Error('canvas fail'));

    setWindowContext({ search: '?new=true' });
    await initInitialLoad();

    expect(dialogMessages[0]?.message).toBe(formatLoadErrorMessage(ERROR_NEW_PROJECT));
    expect(close).toHaveBeenCalled();
    expect(destroy).toHaveBeenCalled();
  });

  it('(x)CLIPBOARD_IMAGE', async () => {
    const { platform, dialogMessages, close, destroy } = createPlatformMock();
    await mockClipboardReadImageFailure(platform, new Error('clipboard fail'));

    setWindowContext({ search: '?clipboard=true' });
    await initInitialLoad();

    expect(dialogMessages[0]?.message).toBe(formatLoadErrorMessage(ERROR_CLIPBOARD_IMAGE_FAILED));
    expect(close).toHaveBeenCalled();
    expect(destroy).toHaveBeenCalled();
  });

  it('(!)PROJECT -> (o)NEW (Open Containing Folder)', async () => {
    const { platform, message } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => false) as any;
    message.mockResolvedValueOnce('open');
    const NativeOpener = await import('~/utils/NativeOpener');
    const revealSpy = vi.spyOn(NativeOpener, 'revealInFileBrowser').mockResolvedValue();
    await mockLayerSuccess();
    await mockCanvasSuccess();

    setWindowContext({ openPath: MISSING_PROJECT_PATH });
    await initInitialLoad();

    expect(revealSpy).toHaveBeenCalledWith(MISSING_PROJECT_PATH);
  });
});
