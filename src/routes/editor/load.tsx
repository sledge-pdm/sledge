import { decode as decodeBase64 } from 'base64-arraybuffer';
import { ErrorTypes, InitialLoadRequest, LoadError, ProjectLoader } from '~/features/io/project/ProjectLoader';
import { EditorStateStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { normalizeJoin, normalizePath } from '~/utils/FileUtils';
import { packr } from '~/utils/msgpackr';

export enum InitialLoadTypes {
  // Configs
  GLOBAL_CONFIG,
  EDITOR_STATE,
  // Project
  NEW_PROJECT,
  NEW_PROJECT_FALLBACK,
  PATH_PROJECT,
  PATH_IMAGE_PROJECT,
  PATH_PROJECT_LAST,
  PATH_IMAGE_PROJECT_LAST,
  IMAGE_CLIPBOARD,
  IMAGE_FILE,
  // Unknown
  UNKNOWN,
}

/**
 * @description Get the type and loader to read from the given query etc.
 */
export async function getInitialLoader(editorState: EditorStateStore): Promise<{
  initialLoadType: InitialLoadTypes;
  loader?: ProjectLoader<any>;
  fatalError?: LoadError;
  targetPath?: string;
}> {
  try {
    // @ts-ignore
    const osOpenPath = window.__PATH__;
    if (osOpenPath) {
      const isProject = ProjectLoader.isProjectPath(osOpenPath);
      const normalizedPath = normalizePath(osOpenPath);
      return {
        initialLoadType: isProject ? InitialLoadTypes.PATH_PROJECT : InitialLoadTypes.PATH_IMAGE_PROJECT,
        loader: ProjectLoader.fromPath({ path: normalizedPath }),
        targetPath: normalizedPath,
      };
    }

    let request: InitialLoadRequest | undefined = undefined;

    // @ts-ignore
    const base64MsgpackrLoadRequest = window.__BASE64_MSGPACKR_LOAD_REQUEST__;
    if (base64MsgpackrLoadRequest && typeof base64MsgpackrLoadRequest === 'string') {
      const packedRequest = decodeBase64(base64MsgpackrLoadRequest);
      if (packedRequest) {
        const unpacked = packr.unpack(new Uint8Array(packedRequest));
        if (unpacked) request = unpacked as InitialLoadRequest;
      }
    }

    if (request) {
      switch (request.type) {
        case 'path':
          const isProject = ProjectLoader.isProjectPath(request.option.path);
          const normalizedPath = normalizePath(request.option.path);
          return {
            initialLoadType: isProject ? InitialLoadTypes.PATH_PROJECT : InitialLoadTypes.PATH_IMAGE_PROJECT,
            loader: ProjectLoader.fromPath({ path: normalizedPath }),
            targetPath: normalizedPath,
          };
        case 'new':
          return {
            initialLoadType: InitialLoadTypes.NEW_PROJECT,
            loader: ProjectLoader.fromNew(request.option),
          };
        case 'projectObj':
          return {
            initialLoadType: InitialLoadTypes.UNKNOWN,
            loader: ProjectLoader.fromProjectObj(request.option),
          };
        case 'image':
          return { initialLoadType: InitialLoadTypes.UNKNOWN, loader: ProjectLoader.fromImage(request.option) };
        case 'clipboard':
          return { initialLoadType: InitialLoadTypes.IMAGE_CLIPBOARD, loader: ProjectLoader.fromClipboard(request.option) };
      }
    }

    const lastLocation = editorState?.lastPath;
    if (globalConfig.default.open === 'last' && lastLocation && lastLocation.path && lastLocation.name) {
      const lastPath = normalizeJoin(lastLocation.path, lastLocation.name);
      const isProject = ProjectLoader.isProjectPath(lastPath);
      return {
        initialLoadType: isProject ? InitialLoadTypes.PATH_PROJECT_LAST : InitialLoadTypes.PATH_IMAGE_PROJECT_LAST,
        loader: ProjectLoader.fromPath({ path: lastPath }),
        targetPath: lastPath,
      };
    }

    return {
      initialLoadType: InitialLoadTypes.NEW_PROJECT_FALLBACK,
      loader: ProjectLoader.fromNew({ ...globalConfig.default.canvasSize }),
    };
  } catch (e) {
    return {
      initialLoadType: InitialLoadTypes.UNKNOWN,
      loader: undefined,
      fatalError: {
        type: ErrorTypes.UNKNOWN_ERROR,
        detail: `Unknown error while initial project load: ${e}`,
        stacktrace: e instanceof Error ? e.stack : undefined,
      },
    };
  }
}
