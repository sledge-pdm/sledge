import { FileLocation } from '@sledge-pdm/core';
import { adjustZoomToFit } from '~/features/canvas';
import { IMPORTABLE_FILE_EXTENSIONS, OPENABLE_FILE_EXTENSIONS } from '~/features/io/Extensions';
import { logUserError, logUserWarn } from '~/features/log/service';
import { globalConfig } from '~/stores/GlobalStores';
import { loadImageData } from '~/utils/DataUtils';
import { normalizeJoin } from '~/utils/FileUtils';
import { unpackFromBytes } from '~/utils/msgpackr';
import { core, dialog, path } from '~/utils/platform';
import { openEditorWindow } from '~/utils/WindowUtils';
import { InitialLoadRequest, ProjectLoader } from './project/ProjectLoader';

const getLoaderFromRequest = (request: InitialLoadRequest): ProjectLoader<any> => {
  switch (request.type) {
    case 'new':
      return ProjectLoader.fromNew(request.option);
    case 'path':
      return ProjectLoader.fromPath(request.option);
    case 'projectObj':
      return ProjectLoader.fromProjectObj(request.option);
    case 'image':
      return ProjectLoader.fromImage(request.option);
    case 'clipboard':
      return ProjectLoader.fromClipboard(request.option);
  }
};

const loadInCurrentTab = async (request: InitialLoadRequest): Promise<boolean> => {
  const result = await getLoaderFromRequest(request).load();
  if (result.ok) {
    adjustZoomToFit();
    return true;
  }
  logUserError(`load failed.\n${result.error?.detail ?? 'unknown error'}`, { label: LOG_LABEL, persistent: true });
  return false;
};

export async function openNewEditorWindow(request: InitialLoadRequest) {
  if (!core.isTauri()) {
    await loadInCurrentTab(request);
    return;
  }
  await openEditorWindow({ loadRequest: request });
}
export async function openNewProject() {
  await openNewEditorWindow(ProjectLoader.getRequestFromNew({ ...globalConfig.default.canvasSize }));
}
export async function openNewProjectWithClipboard() {
  await openNewEditorWindow(ProjectLoader.getRequestFromClipboard({ name: 'from clipboard' }));
}
export async function openExistingProject(pathOrLocation: FileLocation | string) {
  if (!core.isTauri()) {
    logUserWarn('Open by local path is not available in browser. Use Open file.', { label: LOG_LABEL });
    return;
  }
  if (typeof pathOrLocation === 'string') {
    await openEditorWindow({ loadRequest: ProjectLoader.getRequestFromPath({ path: pathOrLocation }) });
  } else {
    if (!pathOrLocation.path || !pathOrLocation.name) return;
    const fullpath = normalizeJoin(pathOrLocation.path, pathOrLocation.name);
    await openEditorWindow({ loadRequest: ProjectLoader.getRequestFromPath({ path: fullpath }) });
  }
}

export async function openNewFile(): Promise<string | undefined> {
  const home = await path.homeDir();
  const file = await dialog.open({
    multiple: false,
    directory: false,
    defaultPath: normalizeJoin(home, 'sledge'),
    filters: [
      {
        name: 'all files.',
        extensions: [...OPENABLE_FILE_EXTENSIONS],
      },
      {
        name: 'sledge files.',
        extensions: ['sledge'],
      },
      {
        name: 'image files.',
        extensions: [...IMPORTABLE_FILE_EXTENSIONS],
      },
    ],
  });

  if (!file) {
    logUserWarn('file not selected.', { label: LOG_LABEL });
    return undefined;
  }

  return file.toString();
}

const pickBrowserFile = async (): Promise<File | undefined> => {
  return await new Promise<File | undefined>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = OPENABLE_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(',');
    input.onchange = () => {
      const file = input.files?.[0];
      resolve(file ?? undefined);
      input.remove();
    };
    input.oncancel = () => {
      resolve(undefined);
      input.remove();
    };
    input.click();
  });
};

const buildBrowserLoadRequest = async (file: File): Promise<InitialLoadRequest | undefined> => {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.sledge')) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const project = unpackFromBytes(bytes);
    if (!project) return undefined;
    return ProjectLoader.getRequestFromProjectObj({ project });
  }

  if (IMPORTABLE_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(`.${ext}`))) {
    const bitmap = await createImageBitmap(file);
    const imageData = await loadImageData(bitmap);
    return ProjectLoader.getRequestFromImage({
      name: file.name,
      buffer: new Uint8ClampedArray(imageData.data),
      width: imageData.width,
      height: imageData.height,
    });
  }

  return undefined;
};

export const openProjectWithExplorer = async () => {
  if (!core.isTauri()) {
    const file = await pickBrowserFile();
    if (!file) {
      logUserWarn('file not selected.', { label: LOG_LABEL });
      return;
    }
    const request = await buildBrowserLoadRequest(file);
    if (!request) {
      logUserWarn('selected file type is not supported.', { label: LOG_LABEL });
      return;
    }
    await loadInCurrentTab(request);
    return;
  }

  const path = await openNewFile();
  if (path !== undefined) {
    await openNewEditorWindow(ProjectLoader.getRequestFromPath({ path }));
  }
};
const LOG_LABEL = 'FileOpen';
