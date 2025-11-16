import { FileLocation } from '@sledge/core';
import { path } from '@tauri-apps/api';
import { open as dialogOpen } from '@tauri-apps/plugin-dialog';
import { addRecentFile } from '~/features/config/RecentFileController';
import { importableFileExtensions } from '~/features/io/FileExtensions';
import { normalizeJoin, pathToFileLocation } from '~/utils/FileUtils';
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
  const file = await dialogOpen({
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
    console.error('file not selected');
    return undefined;
  }

  return file;
}

export const openProject = () => {
  openNewFile().then((file: string | undefined) => {
    console.log(file);
    if (file !== undefined) {
      const loc = pathToFileLocation(file);
      if (!loc) return;
      addRecentFile(loc);
      openExistingProject(loc);
    }
  });
};
