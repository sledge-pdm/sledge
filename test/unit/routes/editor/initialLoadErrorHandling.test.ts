import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDefaultGlobalConfig } from '~/config/GlobalConfig';
import { GLOBAL_CONFIG_ERROR_FAILED_PARSE_JSON } from '~/features/io/config/load';
import { EDITOR_STATE_ERROR_FAILED_PARSE_JSON } from '~/features/io/editor/load';
import { ErrorTypes, ProjectLoader, type InitialLoadRequest } from '~/features/io/project/ProjectLoader';
import { InitialLoadTypes } from '~/routes/editor/load';
import type { EditorStateStore } from '~/stores/EditorStores';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';
import { getBase64MsgpackrRequest } from '~/utils/WindowUtils';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';

vi.mock('~/routes/editor/loadError', async () => {
  const actual = await vi.importActual<typeof import('~/routes/editor/loadError')>('~/routes/editor/loadError');
  return {
    ...actual,
    reportInitialLoadError: vi.fn(async () => {}),
  };
});

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

const setWindowContext = (options: { search?: string; openPath?: string; base64MsgpackrLoadRequest?: string }) => {
  (globalThis as any).window = {
    location: {
      search: options.search ?? '',
    },
    __PATH__: options.openPath,
    __BASE64_MSGPACKR_LOAD_REQUEST__: options.base64MsgpackrLoadRequest,
  };
};

const getBase64LoadRequest = (request: InitialLoadRequest): string => {
  const base64 = getBase64MsgpackrRequest(request);
  if (!base64) {
    throw new Error('Failed to encode InitialLoadRequest.');
  }
  return base64;
};

const setLoadRequest = (request: InitialLoadRequest) => {
  setWindowContext({ base64MsgpackrLoadRequest: getBase64LoadRequest(request) });
};

const createPlatformMock = () => {
  const platform = new TestMockPlatform();
  const dialogs: Array<{ message: string; options?: Record<string, unknown> }> = [];
  const message = vi.fn(async (msg: string, options?: Record<string, unknown>) => {
    dialogs.push({ message: msg, options });
    return 'ok';
  });
  platform.dialog.message = message as any;

  const close = vi.fn(async () => {});
  const destroy = vi.fn(async () => {});
  platform.window.getCurrentWindow = () => ({ close, destroy }) as any;

  setPlatform(platform);
  return { platform, dialogs, message, close, destroy };
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

const getReportInitialLoadErrorMock = async () => {
  const { reportInitialLoadError } = await import('~/routes/editor/loadError');
  return vi.mocked(reportInitialLoadError);
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
  vi.clearAllMocks();
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

    const { loadGlobalConfig: loadGlobalSettings } = await import('~/features/io/config/load');
    const result = await loadGlobalSettings();
    expect(result.error?.type).toBe(ErrorTypes.INTERNAL_ERROR);
    expect(result.error?.detail).toBe(GLOBAL_CONFIG_ERROR_FAILED_PARSE_JSON);

    const reportInitialLoadError = await getReportInitialLoadErrorMock();
    expect(reportInitialLoadError).not.toHaveBeenCalled();
  });

  it('(x)EDITOR_STATE', async () => {
    const { platform } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    platform.fs.readTextFile = vi.fn(async () => '{broken-json') as any;

    const { loadEditorState } = await import('~/features/io/editor/load');

    const result = await loadEditorState();
    expect(result.error?.type).toBe(ErrorTypes.INTERNAL_ERROR);
    expect(result.error?.detail).toBe(EDITOR_STATE_ERROR_FAILED_PARSE_JSON);

    const reportInitialLoadError = await getReportInitialLoadErrorMock();
    expect(reportInitialLoadError).not.toHaveBeenCalled();
  });

  it('(!)PROJECT -> (o)NEW', async () => {
    const { platform } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => false) as any;
    const reportInitialLoadError = await getReportInitialLoadErrorMock();

    await mockLayerSuccess();
    await mockCanvasSuccess();

    setWindowContext({ openPath: MISSING_PROJECT_PATH });
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.PATH_PROJECT,
      expect.objectContaining({ type: ErrorTypes.FILE_NOT_FOUND }),
      undefined,
      MISSING_PROJECT_PATH
    );

    reportInitialLoadError.mockClear();

    setLoadRequest(ProjectLoader.getRequestFromPath({ path: MISSING_PROJECT_PATH }));
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.PATH_PROJECT,
      expect.objectContaining({ type: ErrorTypes.FILE_NOT_FOUND }),
      undefined,
      MISSING_PROJECT_PATH
    );
  });

  it('(!)PROJECT -> (x)NEW', async () => {
    const { platform } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => false) as any;
    const reportInitialLoadError = await getReportInitialLoadErrorMock();

    await mockLayerSuccess();
    await mockCanvasFailure(new Error('canvas fail'));

    setWindowContext({ openPath: MISSING_PROJECT_PATH });
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.NEW_PROJECT_FALLBACK,
      expect.objectContaining({ type: ErrorTypes.FILE_NOT_FOUND }),
      InitialLoadTypes.PATH_PROJECT,
      MISSING_PROJECT_PATH
    );

    reportInitialLoadError.mockClear();

    setLoadRequest(ProjectLoader.getRequestFromPath({ path: MISSING_PROJECT_PATH }));
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.NEW_PROJECT_FALLBACK,
      expect.objectContaining({ type: ErrorTypes.FILE_NOT_FOUND }),
      InitialLoadTypes.PATH_PROJECT,
      MISSING_PROJECT_PATH
    );
  });

  it('(x)PROJECT -> (o)NEW', async () => {
    const { platform } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    const reportInitialLoadError = await getReportInitialLoadErrorMock();
    await mockUnpackFromPathFailure(new Error('boom'));
    await mockLayerSuccess();
    await mockCanvasSuccess();

    setWindowContext({ openPath: BROKEN_PROJECT_PATH });
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.PATH_PROJECT,
      expect.objectContaining({ type: ErrorTypes.FAILED_LOAD_RUNTIME }),
      undefined,
      BROKEN_PROJECT_PATH
    );

    reportInitialLoadError.mockClear();

    setLoadRequest(ProjectLoader.getRequestFromPath({ path: BROKEN_PROJECT_PATH }));
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.PATH_PROJECT,
      expect.objectContaining({ type: ErrorTypes.FAILED_LOAD_RUNTIME }),
      undefined,
      BROKEN_PROJECT_PATH
    );
  });

  it('(x)PROJECT -> (x)NEW', async () => {
    const { platform } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    const reportInitialLoadError = await getReportInitialLoadErrorMock();
    await mockUnpackFromPathFailure(new Error('boom'));
    await mockLayerSuccess();
    await mockCanvasFailure(new Error('canvas fail'));

    setWindowContext({ openPath: BROKEN_PROJECT_PATH });
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.NEW_PROJECT_FALLBACK,
      expect.objectContaining({ type: ErrorTypes.FAILED_LOAD_RUNTIME }),
      InitialLoadTypes.PATH_PROJECT,
      BROKEN_PROJECT_PATH
    );

    reportInitialLoadError.mockClear();

    setLoadRequest(ProjectLoader.getRequestFromPath({ path: BROKEN_PROJECT_PATH }));
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.NEW_PROJECT_FALLBACK,
      expect.objectContaining({ type: ErrorTypes.FAILED_LOAD_RUNTIME }),
      InitialLoadTypes.PATH_PROJECT,
      BROKEN_PROJECT_PATH
    );
  });

  it('(x)CONFIG -> ... -> (x)PROJECT', async () => {
    const { platform } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    platform.fs.readTextFile = vi.fn(async () => '{broken-json') as any;
    const reportInitialLoadError = await getReportInitialLoadErrorMock();
    await mockUnpackFromPathFailure(new Error('boom'));
    await mockLayerSuccess();
    await mockCanvasFailure(new Error('canvas fail'));

    const { loadGlobalConfig: loadGlobalSettings } = await import('~/features/io/config/load');
    await loadGlobalSettings();

    setWindowContext({ openPath: BROKEN_PROJECT_PATH });
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.NEW_PROJECT_FALLBACK,
      expect.objectContaining({ type: ErrorTypes.FAILED_LOAD_RUNTIME }),
      InitialLoadTypes.PATH_PROJECT,
      BROKEN_PROJECT_PATH
    );

    reportInitialLoadError.mockClear();

    setLoadRequest(ProjectLoader.getRequestFromPath({ path: BROKEN_PROJECT_PATH }));
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.NEW_PROJECT_FALLBACK,
      expect.objectContaining({ type: ErrorTypes.FAILED_LOAD_RUNTIME }),
      InitialLoadTypes.PATH_PROJECT,
      BROKEN_PROJECT_PATH
    );
  });

  it('(x)EDITOR_STATE -> ... -> (x)PROJECT', async () => {
    const { platform } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    platform.fs.readTextFile = vi.fn(async () => '{broken-json') as any;
    const reportInitialLoadError = await getReportInitialLoadErrorMock();
    await mockUnpackFromPathFailure(new Error('boom'));
    await mockLayerSuccess();
    await mockCanvasFailure(new Error('canvas fail'));

    const { loadEditorState } = await import('~/features/io/editor/load');
    await loadEditorState();

    setWindowContext({ openPath: BROKEN_PROJECT_PATH });
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.NEW_PROJECT_FALLBACK,
      expect.objectContaining({ type: ErrorTypes.FAILED_LOAD_RUNTIME }),
      InitialLoadTypes.PATH_PROJECT,
      BROKEN_PROJECT_PATH
    );

    reportInitialLoadError.mockClear();

    setLoadRequest(ProjectLoader.getRequestFromPath({ path: BROKEN_PROJECT_PATH }));
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.NEW_PROJECT_FALLBACK,
      expect.objectContaining({ type: ErrorTypes.FAILED_LOAD_RUNTIME }),
      InitialLoadTypes.PATH_PROJECT,
      BROKEN_PROJECT_PATH
    );
  });

  it('(x)IMG_PROJECT -> (o)NEW', async () => {
    const { platform } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    const reportInitialLoadError = await getReportInitialLoadErrorMock();
    await mockLoadLocalImageFailure(new Error('image read failed'));
    await mockLayerSuccess();
    await mockCanvasSuccess();

    setWindowContext({ openPath: IMAGE_PROJECT_PATH });
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.PATH_IMAGE_PROJECT,
      expect.objectContaining({ type: ErrorTypes.FAILED_LOAD_RUNTIME }),
      undefined,
      IMAGE_PROJECT_PATH
    );

    reportInitialLoadError.mockClear();

    setLoadRequest(ProjectLoader.getRequestFromPath({ path: IMAGE_PROJECT_PATH }));
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.PATH_IMAGE_PROJECT,
      expect.objectContaining({ type: ErrorTypes.FAILED_LOAD_RUNTIME }),
      undefined,
      IMAGE_PROJECT_PATH
    );
  });

  it('(!)IMG_PROJECT -> (o)NEW', async () => {
    const { platform } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => false) as any;
    const reportInitialLoadError = await getReportInitialLoadErrorMock();
    await mockLayerSuccess();
    await mockCanvasSuccess();

    setWindowContext({ openPath: MISSING_IMAGE_PATH });
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.PATH_IMAGE_PROJECT,
      expect.objectContaining({ type: ErrorTypes.FILE_NOT_FOUND }),
      undefined,
      MISSING_IMAGE_PATH
    );

    reportInitialLoadError.mockClear();

    setLoadRequest(ProjectLoader.getRequestFromPath({ path: MISSING_IMAGE_PATH }));
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.PATH_IMAGE_PROJECT,
      expect.objectContaining({ type: ErrorTypes.FILE_NOT_FOUND }),
      undefined,
      MISSING_IMAGE_PATH
    );
  });

  it('(!)IMG_PROJECT -> (x)NEW', async () => {
    const { platform } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => false) as any;
    const reportInitialLoadError = await getReportInitialLoadErrorMock();
    await mockLayerSuccess();
    await mockCanvasFailure(new Error('canvas fail'));

    setWindowContext({ openPath: MISSING_IMAGE_PATH });
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.NEW_PROJECT_FALLBACK,
      expect.objectContaining({ type: ErrorTypes.FILE_NOT_FOUND }),
      InitialLoadTypes.PATH_IMAGE_PROJECT,
      MISSING_IMAGE_PATH
    );

    reportInitialLoadError.mockClear();

    setLoadRequest(ProjectLoader.getRequestFromPath({ path: MISSING_IMAGE_PATH }));
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.NEW_PROJECT_FALLBACK,
      expect.objectContaining({ type: ErrorTypes.FILE_NOT_FOUND }),
      InitialLoadTypes.PATH_IMAGE_PROJECT,
      MISSING_IMAGE_PATH
    );
  });

  it('(x)IMG_PROJECT -> (x)NEW', async () => {
    const { platform } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => true) as any;
    const reportInitialLoadError = await getReportInitialLoadErrorMock();
    await mockLoadLocalImageFailure(new Error('image read failed'));
    await mockLayerSuccess();
    await mockCanvasFailure(new Error('canvas fail'));

    setWindowContext({ openPath: IMAGE_PROJECT_PATH });
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.NEW_PROJECT_FALLBACK,
      expect.objectContaining({ type: ErrorTypes.FAILED_LOAD_RUNTIME }),
      InitialLoadTypes.PATH_IMAGE_PROJECT,
      IMAGE_PROJECT_PATH
    );

    reportInitialLoadError.mockClear();

    setLoadRequest(ProjectLoader.getRequestFromPath({ path: IMAGE_PROJECT_PATH }));
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.NEW_PROJECT_FALLBACK,
      expect.objectContaining({ type: ErrorTypes.FAILED_LOAD_RUNTIME }),
      InitialLoadTypes.PATH_IMAGE_PROJECT,
      IMAGE_PROJECT_PATH
    );
  });

  it('(x)NEW', async () => {
    createPlatformMock();
    const reportInitialLoadError = await getReportInitialLoadErrorMock();
    await mockLayerSuccess();
    await mockCanvasFailure(new Error('canvas fail'));

    setLoadRequest(ProjectLoader.getRequestFromNew({ ...globalConfig.default.canvasSize }));
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.NEW_PROJECT,
      expect.objectContaining({ type: ErrorTypes.FAILED_LOAD_RUNTIME }),
      undefined,
      undefined
    );
  });

  it('(x)CLIPBOARD_IMAGE', async () => {
    const { platform } = createPlatformMock();
    const reportInitialLoadError = await getReportInitialLoadErrorMock();
    await mockClipboardReadImageFailure(platform, new Error('clipboard fail'));

    setLoadRequest(ProjectLoader.getRequestFromClipboard({}));
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.IMAGE_CLIPBOARD,
      expect.objectContaining({ type: ErrorTypes.FAILED_LOAD_RUNTIME }),
      undefined,
      undefined
    );
  });

  it('(!)PROJECT -> (o)NEW (Open Containing Folder)', async () => {
    const { platform, message } = createPlatformMock();
    platform.fs.exists = vi.fn(async () => false) as any;
    message.mockResolvedValueOnce('open');
    const reportInitialLoadError = await getReportInitialLoadErrorMock();
    const NativeOpener = await import('~/utils/NativeOpener');
    const revealSpy = vi.spyOn(NativeOpener, 'revealInFileBrowser').mockResolvedValue();
    await mockLayerSuccess();
    await mockCanvasSuccess();

    setWindowContext({ openPath: MISSING_PROJECT_PATH });
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.PATH_PROJECT,
      expect.objectContaining({ type: ErrorTypes.FILE_NOT_FOUND }),
      undefined,
      MISSING_PROJECT_PATH
    );
    expect(revealSpy).not.toHaveBeenCalled();

    reportInitialLoadError.mockClear();
    revealSpy.mockClear();

    setLoadRequest(ProjectLoader.getRequestFromPath({ path: MISSING_PROJECT_PATH }));
    await initInitialLoad();

    expect(reportInitialLoadError).toHaveBeenCalledWith(
      InitialLoadTypes.PATH_PROJECT,
      expect.objectContaining({ type: ErrorTypes.FILE_NOT_FOUND }),
      undefined,
      MISSING_PROJECT_PATH
    );
    expect(revealSpy).not.toHaveBeenCalled();
  });
});
