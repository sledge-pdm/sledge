import { addRecentFile } from '~/features/config/RecentFileController';
import { importableFileExtensions } from '~/features/io/FileExtensions';
import { logUserWarn } from '~/features/log/service';
import { FileLocation } from '~/types/FileLocation';
import { normalizeJoin, pathToFileLocation } from '~/utils/FileUtils';
import { dialog, path } from '~/utils/platform';
import { getNewProjectSearchParams, getProjectFromClipboardSearchParams, openWindow } from '~/utils/WindowUtils';

export const createNew = () => {
  openWindow('editor', { query: getNewProjectSearchParams() });
};

export const openExistingProject = async (selectedFile: FileLocation) => {
  if (!selectedFile.path || !selectedFile.name) return;
  await openWindow('editor', { openPath: normalizeJoin(selectedFile.path, selectedFile.name) });
};

export const openFromClipboard = () => {
  openWindow('editor', { query: getProjectFromClipboardSearchParams() });
};

export async function openNewFile(): Promise<string | undefined> {
  const home = await path.homeDir();
  const file = await dialog.open({
    multiple: false,
    directory: false,
    defaultPath: normalizeJoin(home, 'sledge'),
    filters: [
      {
        name: 'all files.',
        extensions: ['sledge', ...importableFileExtensions],
      },
      {
        name: 'sledge files.',
        extensions: ['sledge'],
      },
      {
        name: 'image files.',
        extensions: [...importableFileExtensions],
      },
    ],
  });

  if (!file) {
    logUserWarn('file not selected.', { label: LOG_LABEL });
    return undefined;
  }

  return file.toString();
}

export const openProject = () => {
  openNewFile().then((file: string | undefined) => {
    if (file !== undefined) {
      const loc = pathToFileLocation(file);
      if (!loc) return;
      addRecentFile(loc);
      openExistingProject(loc);
    }
  });
};
const LOG_LABEL = 'FileOpen';
