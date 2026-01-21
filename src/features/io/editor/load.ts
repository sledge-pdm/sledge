import { Consts } from '~/Consts';
import { logSystemError } from '~/features/log/service';
import { EditorStateStore, getEditorStateStore, loadEditorStateStore } from '~/stores/EditorStores';
import { fs } from '~/utils/platform';
import { ErrorTypes, LoadError } from '../project/ProjectLoader';

export const EDITOR_STATE_ERROR_FILE_NOT_FOUND = `EditorState file not found.`;
export const EDITOR_STATE_ERROR_FAILED_FILE_READ = `Failed to read EditorState file.`;
export const EDITOR_STATE_ERROR_FAILED_PARSE_JSON = `EditorState file not found.`;
export const EDITOR_STATE_ERROR_INTERNAL = `Internal error while loading EditorState.`;
export const EDITOR_STATE_ERROR_UNKNOWN = `Unknown error while loading EditorState.`;

const getErrorStacktrace = (e: unknown): string | undefined => (e instanceof Error ? e.stack : undefined);

/**
 * Optimistic load for EditorState. If file not found, returns default store.
 */
export async function loadEditorState(): Promise<{
  store: EditorStateStore;
  error?: LoadError;
}> {
  try {
    const baseDir = fs.BaseDirectory?.AppConfig;
    let isFileExists = false;
    try {
      isFileExists = baseDir ? await fs.exists(Consts.editorStateFileName, { baseDir }) : await fs.exists(Consts.editorStateFileName);
    } catch (_e) {
      // Let pass through as not existing
    }
    if (!isFileExists) {
      return {
        store: getEditorStateStore(),
        error: {
          type: ErrorTypes.FILE_NOT_FOUND,
          detail: EDITOR_STATE_ERROR_FILE_NOT_FOUND,
        },
      };
    } else {
      let stateData: string | undefined;
      try {
        stateData = await fs.readTextFile(Consts.editorStateFileName, baseDir ? { baseDir } : undefined);
      } catch (e) {
        logSystemError(EDITOR_STATE_ERROR_FAILED_FILE_READ, { label: 'EditorState', details: [e] });
        return {
          store: getEditorStateStore(),
          error: {
            type: ErrorTypes.INTERNAL_ERROR,
            detail: EDITOR_STATE_ERROR_FAILED_FILE_READ,
            stacktrace: getErrorStacktrace(e),
          },
        };
      }

      try {
        const stateJson = JSON.parse(stateData);
        if (stateJson) {
          return {
            store: loadEditorStateStore(stateJson as EditorStateStore),
            error: undefined,
          };
        }
      } catch (e) {
        logSystemError(EDITOR_STATE_ERROR_FAILED_PARSE_JSON, { label: 'EditorState', details: [e] });
        return {
          store: getEditorStateStore(),
          error: {
            type: ErrorTypes.INTERNAL_ERROR,
            detail: EDITOR_STATE_ERROR_FAILED_PARSE_JSON,
            stacktrace: getErrorStacktrace(e),
          },
        };
      }
    }
  } catch (e) {
    // fallback to default
    return {
      store: getEditorStateStore(),
      error: {
        type: ErrorTypes.INTERNAL_ERROR,
        detail: EDITOR_STATE_ERROR_INTERNAL,
        stacktrace: getErrorStacktrace(e),
      },
    };
  }

  // fallback to default
  return {
    store: getEditorStateStore(),
    error: {
      type: ErrorTypes.UNKNOWN_ERROR,
      detail: EDITOR_STATE_ERROR_UNKNOWN,
      stacktrace: undefined,
    },
  };
}
