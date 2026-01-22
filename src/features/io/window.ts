import { FileLocation } from '@sledge-pdm/core';
import { importableFileExtensions } from '~/features/io/FileExtensions';
import { logUserWarn } from '~/features/log/service';
import { globalConfig } from '~/stores/GlobalStores';
import { normalizeJoin } from '~/utils/FileUtils';
import { dialog, path } from '~/utils/platform';
import { openEditorWindow } from '~/utils/WindowUtils';
import { InitialLoadRequest, ProjectLoader } from './project/ProjectLoader';

export function openNewEditorWindow(request: InitialLoadRequest) {
  openEditorWindow({ loadRequest: request });
}
export function openNewProject() {
  openEditorWindow({ loadRequest: ProjectLoader.getRequestFromNew({ ...globalConfig.default.canvasSize }) });
}
export function openNewProjectWithClipboard() {
  openEditorWindow({ loadRequest: ProjectLoader.getRequestFromClipboard({ name: 'from clipboard' }) });
}
export function openExistingProject(pathOrLocation: FileLocation | string) {
  if (typeof pathOrLocation === 'string') {
    openEditorWindow({ loadRequest: ProjectLoader.getRequestFromPath({ path: pathOrLocation }) });
  } else {
    if (!pathOrLocation.path || !pathOrLocation.name) return;
    const fullpath = normalizeJoin(pathOrLocation.path, pathOrLocation.name);
    openEditorWindow({ loadRequest: ProjectLoader.getRequestFromPath({ path: fullpath }) });
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

export const openProjectWithExplorer = () => {
  openNewFile().then((path: string | undefined) => {
    if (path !== undefined) {
      openNewEditorWindow(ProjectLoader.getRequestFromPath({ path }));
    }
  });
};
const LOG_LABEL = 'FileOpen';
