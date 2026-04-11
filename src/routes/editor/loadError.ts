import { ErrorTypes, LoadError } from '~/features/io/project/ProjectLoader';
import { InitialLoadTypes } from '~/routes/editor/load';
import { revealInFileBrowser } from '~/utils/NativeOpener';
import { dialog, window as platformWindow } from '~/utils/platform';

export const ERROR_LOAD_TIMED_OUT =
  'Loading timed out.\n{path}\n\nPossible causes:\n- The file is on a network drive that is not yet connected\n- The project is extremely large\n\nOpening new project.';

export const ERROR_NEW_PROJECT = 'Failed to load new project.';
export const ERROR_NEW_PROJECT_FALLBACK_BUT_ITS_NOT = 'Failed to load new project.';
export const ERROR_LAST_PROJECT_NOT_FOUND_OPENED_NEW = 'Last project file({path}) not found.\nOpening new project.';
export const ERROR_LAST_PROJECT_FAILED_OPENED_NEW = 'Failed to load last project({path}).\nOpening new project.';
export const ERROR_LAST_PROJECT_FAILED_NEW_FAILED = 'Failed to load last project({path}).\nTried to load new project but failed.';
export const ERROR_CLIPBOARD_IMAGE_FAILED = 'Failed to load project from clipboard.';
export const ERROR_UNKNOWN = 'Unknown error.';

export const ERROR_DIALOG_TITLES: Record<ErrorTypes, string> = {
  [ErrorTypes.FAILED_LOAD_RUNTIME]: 'Error: Failed to load',
  [ErrorTypes.FILE_NOT_FOUND]: 'Error: File not found',
  [ErrorTypes.INTERNAL_ERROR]: 'Error: Internal error',
  [ErrorTypes.UNKNOWN_ERROR]: 'Error: Unknown',
};

const BUTTON_OK = 'OK';
const BUTTON_OPEN_CONTAINING_FOLDER = 'Open Containing Folder';

export const formatLoadErrorMessage = (message: string, path?: string) => {
  if (!message.includes('{path}')) return message;
  if (!path) return message;
  return message.replace('{path}', path);
};

const appendStacktrace = (message: string, stacktrace?: string) => {
  if (!stacktrace) return message;
  return `${message}\n\nstacktrace:\n${stacktrace}`;
};

const closeCurrentWindow = async () => {
  const currentWindow = platformWindow.getCurrentWindow();
  await currentWindow.close();
  await currentWindow.destroy();
};

const showDialog = async (
  errorType: ErrorTypes,
  message: string,
  options: { closeWindowWithOK?: boolean; openPathButton?: boolean; path?: string; stacktrace?: string }
) => {
  const formatted = appendStacktrace(formatLoadErrorMessage(message, options.path), options.stacktrace);
  if (options.openPathButton && options.path) {
    const button = await dialog.message(formatted, {
      kind: 'error',
      title: ERROR_DIALOG_TITLES[errorType],
      buttons: { ok: BUTTON_OK, open: BUTTON_OPEN_CONTAINING_FOLDER },
    });
    if (button === 'open') await revealInFileBrowser(options.path);
    if (options.closeWindowWithOK) await closeCurrentWindow();
    return;
  }

  await dialog.message(formatted, {
    kind: 'error',
    title: ERROR_DIALOG_TITLES[errorType],
    okLabel: BUTTON_OK,
  });

  if (options.closeWindowWithOK) await closeCurrentWindow();
};

const errorFallback: LoadError = {
  type: ErrorTypes.UNKNOWN_ERROR,
  detail: 'Unknown error',
};

export async function reportLoadTimeout(path: string): Promise<void> {
  await showDialog(ErrorTypes.INTERNAL_ERROR, ERROR_LOAD_TIMED_OUT, {
    closeWindowWithOK: false,
    path,
  });
}

export async function reportInitialLoadError(type: InitialLoadTypes, error?: LoadError, fallbackBeforeType?: InitialLoadTypes, targetPath?: string) {
  const fallbackedError: LoadError = Object.assign(errorFallback, error);
  const isFileNotFound = fallbackedError.type === ErrorTypes.FILE_NOT_FOUND;
  const isPathProjectFallback =
    fallbackBeforeType === InitialLoadTypes.PATH_PROJECT ||
    fallbackBeforeType === InitialLoadTypes.PATH_PROJECT_LAST ||
    fallbackBeforeType === InitialLoadTypes.PATH_IMAGE_PROJECT ||
    fallbackBeforeType === InitialLoadTypes.PATH_IMAGE_PROJECT_LAST;

  switch (type) {
    case InitialLoadTypes.GLOBAL_CONFIG:
    case InitialLoadTypes.EDITOR_STATE:
      await showDialog(fallbackedError.type, fallbackedError.detail, { closeWindowWithOK: false, stacktrace: fallbackedError.stacktrace });
      break;
    case InitialLoadTypes.NEW_PROJECT:
      await showDialog(fallbackedError.type, ERROR_NEW_PROJECT, { closeWindowWithOK: true, stacktrace: fallbackedError.stacktrace });
      return;

    case InitialLoadTypes.IMAGE_CLIPBOARD:
      await showDialog(fallbackedError.type, ERROR_CLIPBOARD_IMAGE_FAILED, { closeWindowWithOK: true, stacktrace: fallbackedError.stacktrace });
      return;

    case InitialLoadTypes.PATH_PROJECT:
    case InitialLoadTypes.PATH_IMAGE_PROJECT:
    case InitialLoadTypes.PATH_PROJECT_LAST:
    case InitialLoadTypes.PATH_IMAGE_PROJECT_LAST:
      await showDialog(fallbackedError.type, isFileNotFound ? ERROR_LAST_PROJECT_NOT_FOUND_OPENED_NEW : ERROR_LAST_PROJECT_FAILED_OPENED_NEW, {
        closeWindowWithOK: false,
        openPathButton: isFileNotFound,
        path: targetPath,
        stacktrace: fallbackedError.stacktrace,
      });
      return;

    case InitialLoadTypes.NEW_PROJECT_FALLBACK:
      if (!isPathProjectFallback) {
        await showDialog(fallbackedError.type, ERROR_NEW_PROJECT_FALLBACK_BUT_ITS_NOT, {
          closeWindowWithOK: true,
          stacktrace: fallbackedError.stacktrace,
        });
        return;
      }
      await showDialog(fallbackedError.type, isFileNotFound ? ERROR_LAST_PROJECT_NOT_FOUND_OPENED_NEW : ERROR_LAST_PROJECT_FAILED_NEW_FAILED, {
        closeWindowWithOK: true,
        openPathButton: isFileNotFound,
        path: targetPath,
        stacktrace: fallbackedError.stacktrace,
      });
      return;

    default:
      await showDialog(fallbackedError.type, error?.detail ?? ERROR_UNKNOWN, { closeWindowWithOK: true, stacktrace: fallbackedError.stacktrace });
      return;
  }
}
