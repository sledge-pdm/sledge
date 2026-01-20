// TODO: エラーを構造的な命名で管理する　くれぐれもバラバラな名前にはしないように
// もしかしたら関数定義でもいい？

import { ErrorTypes, LoadResult } from '~/features/io/project/ProjectLoader';
import { InitialLoadTypes } from '~/routes/editor/load';
import { revealInFileBrowser } from '~/utils/NativeOpener';
import { dialog, window as platformWindow } from '~/utils/platform';

export const ERROR_NEW_PROJECT = 'Failed to load new project.';
export const ERROR_LAST_PROJECT_NOT_FOUND_OPENED_NEW = 'Last project file({path}) not found.\nOpening new project.';
export const ERROR_LAST_PROJECT_FAILED_OPENED_NEW = 'Failed to load last project({path}).\nOpening new project.';
export const ERROR_LAST_PROJECT_FAILED_NEW_FAILED = 'Failed to load last project({path}).\nTried to load new project but failed.';
export const ERROR_CLIPBOARD_IMAGE_FAILED = 'Failed to load project from clipboard.';
export const ERROR_UNKNOWN = 'Failed to load project.';

const BUTTON_OK = 'OK';
const BUTTON_OPEN_CONTAINING_FOLDER = 'Open Containing Folder';

export const formatLoadErrorMessage = (message: string, path?: string) => {
  if (!message.includes('{path}')) return message;
  if (!path) return message;
  return message.replace('{path}', path);
};

const closeCurrentWindow = async () => {
  const currentWindow = platformWindow.getCurrentWindow();
  await currentWindow.close();
  await currentWindow.destroy();
};

const showDialog = async (message: string, options: { closeWindowOnOk?: boolean; openContainingFolder?: boolean; path?: string }) => {
  const formatted = formatLoadErrorMessage(message, options.path);
  if (options.openContainingFolder && options.path) {
    const button = await dialog.message(formatted, {
      kind: 'error',
      title: 'Error',
      buttons: { ok: BUTTON_OK, open: BUTTON_OPEN_CONTAINING_FOLDER },
    });
    if (button === 'open') await revealInFileBrowser(options.path);
    if (options.closeWindowOnOk) await closeCurrentWindow();
    return;
  }

  await dialog.message(formatted, {
    kind: 'error',
    title: 'Error',
    okLabel: BUTTON_OK,
  });

  if (options.closeWindowOnOk) await closeCurrentWindow();
};

export async function reportInitialLoadError(
  type: InitialLoadTypes,
  error?: LoadResult['error'],
  fallbackBeforeType?: InitialLoadTypes,
  targetPath?: string
) {
  const isFileNotFound = error?.type === ErrorTypes.FILE_NOT_FOUND;
  const isPathFallback =
    fallbackBeforeType === InitialLoadTypes.PATH_PROJECT ||
    fallbackBeforeType === InitialLoadTypes.PATH_PROJECT_LAST ||
    fallbackBeforeType === InitialLoadTypes.PATH_IMAGE_PROJECT ||
    fallbackBeforeType === InitialLoadTypes.PATH_IMAGE_PROJECT_LAST;

  switch (type) {
    case InitialLoadTypes.NEW_PROJECT:
      await showDialog(ERROR_NEW_PROJECT, { closeWindowOnOk: true });
      return;

    case InitialLoadTypes.IMAGE_CLIPBOARD:
      await showDialog(ERROR_CLIPBOARD_IMAGE_FAILED, { closeWindowOnOk: true  });
      return;

    case InitialLoadTypes.PATH_PROJECT:
    case InitialLoadTypes.PATH_IMAGE_PROJECT:
    case InitialLoadTypes.PATH_PROJECT_LAST:
    case InitialLoadTypes.PATH_IMAGE_PROJECT_LAST:
      await showDialog(isFileNotFound ? ERROR_LAST_PROJECT_NOT_FOUND_OPENED_NEW : ERROR_LAST_PROJECT_FAILED_OPENED_NEW, {
        openContainingFolder: isFileNotFound,
        path: targetPath,
      });
      return;

    case InitialLoadTypes.NEW_PROJECT_FALLBACK:
      if (!isPathFallback) {
        await showDialog(error?.detail ?? ERROR_UNKNOWN, { closeWindowOnOk: true });
        return;
      }
      await showDialog(isFileNotFound ? ERROR_LAST_PROJECT_NOT_FOUND_OPENED_NEW : ERROR_LAST_PROJECT_FAILED_NEW_FAILED, {
        closeWindowOnOk: true,
        openContainingFolder: isFileNotFound,
        path: targetPath,
      });
      return;

    default:
      await showDialog(error?.detail ?? ERROR_UNKNOWN, { closeWindowOnOk: true });
      return;
  }
}
