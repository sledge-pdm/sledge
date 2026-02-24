import { Consts } from '~/Consts';
import { loadJsonFileWithFallback } from '~/features/io/common/JsonFileLoader';
import { logSystemError } from '~/features/log/service';
import { EditorStateStore, getEditorStateStore, loadEditorStateStore } from '~/stores/EditorStores';
import { fs } from '~/utils/platform';
import { ErrorTypes, LoadError } from '../project/ProjectLoader';

export const EDITOR_STATE_ERROR_FILE_NOT_FOUND = `EditorState file not found.`;
export const EDITOR_STATE_ERROR_FAILED_FILE_READ = `Failed to read EditorState file.`;
export const EDITOR_STATE_ERROR_FAILED_PARSE_JSON = `Failed to parse EditorState file JSON.`;
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
  const baseDir = fs.BaseDirectory?.AppConfig;

  return await loadJsonFileWithFallback<{
    store: EditorStateStore;
    error?: LoadError;
  }>(Consts.editorStateFileName, baseDir, {
    onNotFound: () => ({
      store: getEditorStateStore(),
      error: {
        type: ErrorTypes.FILE_NOT_FOUND,
        detail: EDITOR_STATE_ERROR_FILE_NOT_FOUND,
      },
    }),
    onReadError: (e) => {
      logSystemError(EDITOR_STATE_ERROR_FAILED_FILE_READ, { label: 'EditorState', details: [e] });
      return {
        store: getEditorStateStore(),
        error: {
          type: ErrorTypes.INTERNAL_ERROR,
          detail: EDITOR_STATE_ERROR_FAILED_FILE_READ,
          stacktrace: getErrorStacktrace(e),
        },
      };
    },
    onParseError: (e) => {
      logSystemError(EDITOR_STATE_ERROR_FAILED_PARSE_JSON, { label: 'EditorState', details: [e] });
      return {
        store: getEditorStateStore(),
        error: {
          type: ErrorTypes.INTERNAL_ERROR,
          detail: EDITOR_STATE_ERROR_FAILED_PARSE_JSON,
          stacktrace: getErrorStacktrace(e),
        },
      };
    },
    onSuccess: (stateJson) => {
      if (stateJson) {
        return {
          store: loadEditorStateStore(stateJson as EditorStateStore),
          error: undefined,
        };
      }
      return {
        store: getEditorStateStore(),
        error: {
          type: ErrorTypes.UNKNOWN_ERROR,
          detail: EDITOR_STATE_ERROR_UNKNOWN,
          stacktrace: undefined,
        },
      };
    },
    onUnexpectedError: (e) => ({
      store: getEditorStateStore(),
      error: {
        type: ErrorTypes.INTERNAL_ERROR,
        detail: EDITOR_STATE_ERROR_INTERNAL,
        stacktrace: getErrorStacktrace(e),
      },
    }),
  });
}
