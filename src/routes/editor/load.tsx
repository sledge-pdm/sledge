import { FileLocation } from '@sledge-pdm/core';
import { tryGetImageFromClipboard } from '~/features/io/clipboard/ClipboardUtils';

import { LoadResult, ProjectLoader } from '~/features/io/project/ProjectLoader';
import { globalConfig } from '~/stores/GlobalStores';
import { normalizeJoin, normalizePath } from '~/utils/FileUtils';
import { getFromClipboardQuery, getNewProjectQuery, getOpenPath } from '~/utils/WindowUtils';

export async function tryLoadProject(lastState?: { lastOpenAs?: 'project' | 'new_project' | 'image'; lastPath?: FileLocation }): Promise<LoadResult> {
  const openingPath = getOpenPath();
  const clipboardQuery = getFromClipboardQuery();
  const newProjectQuery = getNewProjectQuery();
  let lastLocation = lastState?.lastPath;

  if (openingPath) {
    return await ProjectLoader.fromPath({ path: normalizePath(openingPath) }).load();
  }
  if (clipboardQuery) {
    const data = await tryGetImageFromClipboard();
    if (!data) {
      return { ok: false, error: 'Failed to load project from clipboard', type: 'image' };
    }
    return await ProjectLoader.fromImage({ name: 'From Clipboard', ...data }).load();
  }

  if (newProjectQuery.new) {
    const width = newProjectQuery?.width ?? globalConfig.default.canvasSize.width;
    const height = newProjectQuery?.height ?? globalConfig.default.canvasSize.height;
    return await ProjectLoader.fromNew({ width, height }).load();
  }

  if (globalConfig.default.open === 'last' && lastLocation && lastLocation.path && lastLocation.name) {
    const lastPath = normalizeJoin(lastLocation.path, lastLocation.name);
    return await ProjectLoader.fromPath({ path: lastPath }).load();
  }

  const width = newProjectQuery?.width ?? globalConfig.default.canvasSize.width;
  const height = newProjectQuery?.height ?? globalConfig.default.canvasSize.height;
  return await ProjectLoader.fromNew({ width, height }).load();
}
