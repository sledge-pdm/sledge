import { tryGetImageFromClipboard } from '~/features/io/clipboard/ClipboardUtils';

import { ErrorTypes, LoadResult, ProjectLoader } from '~/features/io/project/ProjectLoader';
import { EditorStateStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { normalizeJoin, normalizePath } from '~/utils/FileUtils';
import { getFromClipboardQuery, getNewProjectQuery, getOpenPath } from '~/utils/WindowUtils';

export enum InitialLoadTypes {
  NEW_PROJECT,
  NEW_PROJECT_FALLBACK,
  PATH_PROJECT,
  PATH_IMAGE_PROJECT,
  PATH_PROJECT_LAST,
  PATH_IMAGE_PROJECT_LAST,
  IMAGE_CLIPBOARD,
}

/**
 * @description Get the type and loader to read from the given query etc.
 */
export async function getInitialLoader(editorState: EditorStateStore): Promise<{
  initialLoadType: InitialLoadTypes;
  loader?: ProjectLoader<any>;
  fatalError?: LoadResult['error'];
  targetPath?: string;
}> {
  const openingPath = getOpenPath();
  const clipboardQuery = getFromClipboardQuery();
  const newProjectQuery = getNewProjectQuery();
  let lastLocation = editorState?.lastPath;

  if (openingPath) {
    const isProject = ProjectLoader.isProjectPath(openingPath);
    const normalizedPath = normalizePath(openingPath);
    return {
      initialLoadType: isProject ? InitialLoadTypes.PATH_PROJECT : InitialLoadTypes.PATH_IMAGE_PROJECT,
      loader: ProjectLoader.fromPath({ path: normalizedPath }),
      targetPath: normalizedPath,
    };
  }
  if (clipboardQuery) {
    const data = await tryGetImageFromClipboard();
    if (!data) {
      return {
        initialLoadType: InitialLoadTypes.IMAGE_CLIPBOARD,
        loader: undefined,
        fatalError: {
          type: ErrorTypes.FAILED_LOAD_RUNTIME,
          detail: 'Could not read clipboard image',
        },
        targetPath: undefined,
      };
    }
    return {
      initialLoadType: InitialLoadTypes.IMAGE_CLIPBOARD,
      loader: ProjectLoader.fromImage({
        imageContext: 'clipboard',
        name: 'From Clipboard',
        ...data,
      }),
    };
  }

  if (newProjectQuery.new) {
    const width = newProjectQuery?.width ?? globalConfig.default.canvasSize.width;
    const height = newProjectQuery?.height ?? globalConfig.default.canvasSize.height;
    return {
      initialLoadType: InitialLoadTypes.NEW_PROJECT,
      loader: ProjectLoader.fromNew({ width, height }),
    };
  }

  if (globalConfig.default.open === 'last' && lastLocation && lastLocation.path && lastLocation.name) {
    const lastPath = normalizeJoin(lastLocation.path, lastLocation.name);
    const isProject = ProjectLoader.isProjectPath(lastPath);
    return {
      initialLoadType: isProject ? InitialLoadTypes.PATH_PROJECT_LAST : InitialLoadTypes.PATH_IMAGE_PROJECT_LAST,
      loader: ProjectLoader.fromPath({ path: lastPath }),
      targetPath: lastPath,
    };
  }

  const width = newProjectQuery?.width ?? globalConfig.default.canvasSize.width;
  const height = newProjectQuery?.height ?? globalConfig.default.canvasSize.height;
  return {
    initialLoadType: InitialLoadTypes.NEW_PROJECT_FALLBACK,
    loader: ProjectLoader.fromNew({ width, height }),
  };
}

// export async function tryLoadProject(lastState?: { lastOpenAs?: 'project' | 'new_project' | 'image'; lastPath?: FileLocation }): Promise<LoadResult> {
//   const openingPath = getOpenPath();
//   const clipboardQuery = getFromClipboardQuery();
//   const newProjectQuery = getNewProjectQuery();
//   let lastLocation = lastState?.lastPath;

//   if (openingPath) {
//     return await ProjectLoader.fromPath({ path: normalizePath(openingPath) }).load();
//   }
//   if (clipboardQuery) {
//     const data = await tryGetImageFromClipboard();
//     if (!data) {
//       return { type: 'image', ok: false, error: { type: ErrorTypes.FAILED_LOAD_RUNTIME, detail: 'Failed to load project from clipboard' } };
//     }
//     return await ProjectLoader.fromImage({
//       imageContext: 'clipboard',
//       name: 'From Clipboard',
//       ...data,
//     }).load();
//   }

//   if (newProjectQuery.new) {
//     const width = newProjectQuery?.width ?? globalConfig.default.canvasSize.width;
//     const height = newProjectQuery?.height ?? globalConfig.default.canvasSize.height;
//     return await ProjectLoader.fromNew({ width, height }).load();
//   }

//   if (globalConfig.default.open === 'last' && lastLocation && lastLocation.path && lastLocation.name) {
//     const lastPath = normalizeJoin(lastLocation.path, lastLocation.name);
//     return await ProjectLoader.fromPath({ path: lastPath }).load();
//   }

//   const width = newProjectQuery?.width ?? globalConfig.default.canvasSize.width;
//   const height = newProjectQuery?.height ?? globalConfig.default.canvasSize.height;
//   return await ProjectLoader.fromNew({ width, height }).load();
// }
