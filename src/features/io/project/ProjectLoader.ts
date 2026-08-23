import { FileLocation, ProjectBase, RawPixelData } from '@sledge-pdm/core';
import { changeCanvasSize } from '~/features/canvas';
import { setSavedLocation } from '~/features/config';
import { addRecentFile } from '~/features/config/RecentFileController';
import { historyManager } from '~/features/history';
import { clearImagePoolBlobUrls } from '~/features/image_pool/blobManager';
import { setImagePoolImages } from '~/features/image_pool/imageStore';
import { addLayer } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logSystemError, logUserError } from '~/features/log/service';
import { markProjectSaved } from '~/features/project';
import { CURRENT_PROJECT_VERSION } from '~/features/project/Consts';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import { defaultInteractStore } from '~/stores/editor/InteractStore';
import { setIOStore, setInteractStore } from '~/stores/EditorStores';
import { initRuntimeProject } from '~/stores/RuntimeProject';
import { resetRuntimeProjectStore } from '~/stores/RuntimeProjectStore';
import { loadImageData, loadLocalImage } from '~/utils/DataUtils';
import { pathToFileLocation } from '~/utils/FileUtils';
import { unpackFromPath } from '~/utils/msgpackr';
import { fs } from '~/utils/platform';
import { getCurrentVersion } from '~/utils/VersionUtils';
import { tryGetImageFromClipboard } from '../clipboard/ClipboardUtils';
import { applyProjectLocation, applyProjectLocationFromPathOrEmpty } from './ProjectLocationManager';
import { cancelSave } from './ProjectSave';

type LoadType = 'new' | 'path' | 'projectObj' | 'image' | 'clipboard';

interface LoadOption {}

interface NewProjectLoadOption extends LoadOption {
  width: number;
  height: number;
}

interface PathLoadOption extends LoadOption {
  path: string;
}

interface ProjectObjLoadOption extends LoadOption {
  project: ProjectBase;
  locationOverride?: FileLocation;
}

interface ImageLoadOptions extends LoadOption {
  name?: string;
  buffer: RawPixelData;
  width: number;
  height: number;
}

interface ClipboardLoadOptions extends LoadOption {
  name?: string;
}

export enum ErrorTypes {
  FILE_NOT_FOUND,
  INTERNAL_ERROR,
  FAILED_LOAD_RUNTIME,
  UNKNOWN_ERROR,
}

export interface LoadError {
  type: ErrorTypes;
  detail: string;
  stacktrace?: string;
}

const getErrorStacktrace = (e: unknown): string | undefined => (e instanceof Error ? e.stack : undefined);

interface InternalLoadResult {
  ok: boolean;
  error?: LoadError;
  path?: string;
}

export type InitialLoadRequest =
  | { type: 'new'; option: { width: number; height: number } }
  | { type: 'path'; option: { path: string } }
  | { type: 'projectObj'; option: ProjectObjLoadOption }
  | { type: 'image'; option: ImageLoadOptions }
  | { type: 'clipboard'; option: ClipboardLoadOptions };

export interface LoadResult extends InternalLoadResult {
  type: LoadType;
}

const LOG_LABEL = 'ProjectLoader';

/**
 * @description Class to utilize project load. Note that this class just handles "loading current window".
 */
export class ProjectLoader<T extends LoadOption> {
  constructor(
    private type: LoadType,
    private options: T
  ) {}

  static getRequestFromNew(option: NewProjectLoadOption): InitialLoadRequest {
    return { type: 'new', option };
  }
  static getRequestFromPath(option: PathLoadOption): InitialLoadRequest {
    return { type: 'path', option };
  }
  static getRequestFromProjectObj(option: ProjectObjLoadOption): InitialLoadRequest {
    return { type: 'projectObj', option };
  }
  static getRequestFromImage(option: ImageLoadOptions): InitialLoadRequest {
    return { type: 'image', option };
  }
  static getRequestFromClipboard(option: ClipboardLoadOptions): InitialLoadRequest {
    return { type: 'clipboard', option };
  }

  static fromNew(option: NewProjectLoadOption) {
    return new ProjectLoader<NewProjectLoadOption>('new', option);
  }
  static fromPath(option: PathLoadOption) {
    return new ProjectLoader<PathLoadOption>('path', option);
  }
  static fromProjectObj(option: ProjectObjLoadOption) {
    return new ProjectLoader<ProjectObjLoadOption>('projectObj', option);
  }
  static fromImage(option: ImageLoadOptions) {
    return new ProjectLoader<ImageLoadOptions>('image', option);
  }
  static fromClipboard(option: ClipboardLoadOptions) {
    return new ProjectLoader<ClipboardLoadOptions>('clipboard', option);
  }

  static isProjectPath(path: string) {
    return path.endsWith('.sledge');
  }

  public async load(): Promise<LoadResult> {
    let result: InternalLoadResult;
    switch (this.type) {
      case 'new':
        initBeforeLoad();
        result = await loadNewProject(this.options as unknown as NewProjectLoadOption);
        break;
      case 'path':
        result = await loadFromPath(this.options as unknown as PathLoadOption);
        break;
      case 'projectObj':
        initBeforeLoad();
        result = await loadFromProjectObj(this.options as unknown as ProjectObjLoadOption);
        break;
      case 'image':
        initBeforeLoad();
        result = await loadFromImage(this.options as unknown as ImageLoadOptions);
        break;
      case 'clipboard':
        initBeforeLoad();
        result = await loadFromClipboard(this.options as unknown as ClipboardLoadOptions);
        break;
    }

    return { ...result, type: this.type };
  }
}

function initBeforeLoad() {
  // a save assembling right now is describing the project we are about to throw away, and it reads from
  // the layers disposeAll is about to take down.
  cancelSave();
  floatingMoveManager.cancel();
  selectionManager.clearAll();
  historyManager.clearHistory();
  layerManager.disposeAll();
  clearImagePoolBlobUrls();
  setImagePoolImages(new Map());
  resetRuntimeProjectStore();
  setInteractStore(structuredClone(defaultInteractStore));
  setIOStore('savedLocation', { name: undefined, path: undefined });
  setIOStore('loadProjectVersion', undefined);
  markProjectSaved();
}

async function loadNewProject(options: NewProjectLoadOption): Promise<InternalLoadResult> {
  try {
    historyManager.clearHistory();
    const { width, height } = options;
    setIOStore('openAs', 'new_project');
    setIOStore('loadProjectVersion', {
      project: CURRENT_PROJECT_VERSION,
      sledge: await getCurrentVersion(),
    });
    applyProjectLocation(undefined, 'new_project');
    const size = { width, height };
    changeCanvasSize(size, {
      register: false,
    });
    addLayer(
      { name: 'layer 1' },
      {
        register: false,
        uniqueName: false,
      }
    );
    markProjectSaved();
    return {
      ok: true,
    };
  } catch (e) {
    return {
      ok: false,
      error: {
        type: ErrorTypes.FAILED_LOAD_RUNTIME,
        detail: `Error loading new project: ${e}`,
        stacktrace: getErrorStacktrace(e),
      },
    };
  }
}

async function loadFromPath(options: PathLoadOption): Promise<InternalLoadResult> {
  const path = options.path;

  let fileExists = false;
  try {
    fileExists = await fs.exists(path);
  } catch (_e) {
    // Let pass through as not existing file
  }

  if (fileExists) {
    initBeforeLoad();
    const result = ProjectLoader.isProjectPath(path) ? await loadFromPathProject(path) : await loadFromPathImage(path);
    if (result.ok) {
      addRecentFile(pathToFileLocation(path));
    }
    return result;
  } else {
    logSystemError('Project file not found.', { label: LOG_LABEL, details: [path] });
    logUserError('failed to open project file.', { label: LOG_LABEL, persistent: true });
    return {
      ok: false,
      error: { type: ErrorTypes.FILE_NOT_FOUND, detail: `Project file not found.` },
      path,
    };
  }
}

async function loadFromPathProject(path: string): Promise<InternalLoadResult> {
  try {
    setIOStore('openAs', 'project');
    applyProjectLocationFromPathOrEmpty(path, 'project');
    const unpacked = await unpackFromPath(path);
    const result = await loadFromProjectObj({
      project: unpacked,
    });
    if (result.ok) setSavedLocation(path);
    return {
      ...result,
      path,
    };
  } catch (e) {
    logSystemError('Failed to read project.', { label: LOG_LABEL, details: [path, e] });
    logUserError('failed to open project file.', { label: LOG_LABEL, details: [e], persistent: true });
    return {
      ok: false,
      error: {
        type: ErrorTypes.FAILED_LOAD_RUNTIME,
        detail: `Error loading project from path: ${e}`,
        stacktrace: getErrorStacktrace(e),
      },
      path,
    };
  }
}

async function loadFromPathImage(path: string): Promise<InternalLoadResult> {
  try {
    setIOStore('openAs', 'image');
    const bitmap = await loadLocalImage(path);
    const imageData = await loadImageData(bitmap);
    const loc = applyProjectLocationFromPathOrEmpty(path, 'image');
    const result = await loadFromImage({
      name: loc?.name,
      buffer: new Uint8ClampedArray(imageData.data),
      width: imageData.width,
      height: imageData.height,
    });
    markProjectSaved();
    return {
      ...result,
      path,
    };
  } catch (e) {
    logSystemError('Failed to import image from path.', { label: LOG_LABEL, details: [path, e] });
    logUserError('failed to import image.', { label: LOG_LABEL, persistent: true });
    return {
      ok: false,
      error: { type: ErrorTypes.FAILED_LOAD_RUNTIME, detail: `Error loading project from image: ${e}`, stacktrace: getErrorStacktrace(e) },
      path,
    };
  }
}

async function loadFromProjectObj(options: ProjectObjLoadOption): Promise<InternalLoadResult> {
  try {
    setIOStore('openAs', 'project');
    const project = options.project;
    await initRuntimeProject(project);
    if (options.locationOverride) setIOStore('savedLocation', options.locationOverride);
    markProjectSaved();
    return {
      ok: true,
    };
  } catch (e) {
    return {
      ok: false,
      error: { type: ErrorTypes.FAILED_LOAD_RUNTIME, detail: `Error loading project from project data: ${e}`, stacktrace: getErrorStacktrace(e) },
    };
  }
}

function applyImageToProject(options: ImageLoadOptions): void {
  setIOStore('openAs', 'image');
  const size = { width: options.width, height: options.height };
  changeCanvasSize(size, {
    register: false,
  });
  addLayer(
    { name: options.name },
    {
      register: false,
      uniqueName: false,
      initImage: options.buffer,
    }
  );
}

async function loadFromImage(options: ImageLoadOptions): Promise<InternalLoadResult> {
  try {
    historyManager.clearHistory();
    applyImageToProject(options);
    return {
      ok: true,
    };
  } catch (e) {
    return {
      ok: false,
      error: { type: ErrorTypes.FAILED_LOAD_RUNTIME, detail: `Error loading project from image: ${e}`, stacktrace: getErrorStacktrace(e) },
    };
  }
}

async function loadFromClipboard(options: ClipboardLoadOptions): Promise<InternalLoadResult> {
  try {
    historyManager.clearHistory();
    const imgData = await tryGetImageFromClipboard();
    if (!imgData) {
      throw new Error('failed to load image.');
    }

    const { width, height, buffer } = imgData;
    applyImageToProject({
      name: options.name ?? 'clipboard image',
      width,
      height,
      buffer,
    });
    markProjectSaved();
    return {
      ok: true,
    };
  } catch (e) {
    return {
      ok: false,
      error: { type: ErrorTypes.FAILED_LOAD_RUNTIME, detail: `Error loading project from clipboard: ${e}`, stacktrace: getErrorStacktrace(e) },
    };
  }
}
