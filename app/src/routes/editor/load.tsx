import { FileLocation } from '@sledge/core';
import { message } from '@tauri-apps/plugin-dialog';
import { getEmergencyBackups } from '~/features/backup';
import { changeCanvasSizeWithNoOffset } from '~/features/canvas';
import { setSavedLocation } from '~/features/config';
import { readProjectFromPath } from '~/features/io/project/in/import';
import { loadProjectJson } from '~/features/io/project/in/load';
import { loadProjectFromClipboardImage, loadProjectFromImagePath as loadProjectFromLocalImage } from '~/features/io/project/in/loadFrom';
import { applyProjectLocation } from '~/features/io/project/ProjectLocationManager';
import { CURRENT_PROJECT_VERSION } from '~/features/io/types/Project';
import { addLayer, LayerType } from '~/features/layer';
import { anvilManager } from '~/features/layer/anvil/AnvilManager';
import { logSystemError, logUserError } from '~/features/log/service';
import { setFileStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { layerListStore, setCanvasStore, setProjectStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { normalizeJoin } from '~/utils/FileUtils';
import { getCurrentVersion } from '~/utils/VersionUtils';
import { getFromClipboardQuery, getNewProjectQuery, getOpenLocation, openWindow } from '~/utils/WindowUtils';

const LOG_LABEL = 'ProjectLoader';

export async function tryLoadProject(lastState?: { lastOpenAs?: 'project' | 'new_project' | 'image'; lastPath?: FileLocation }): Promise<boolean> {
  const openingLocation = getOpenLocation();
  const clipboardQuery = getFromClipboardQuery();
  const newProjectQuery = getNewProjectQuery();

  const emergencyBackups = await getEmergencyBackups();
  if (emergencyBackups && emergencyBackups.length > 0) {
    await openWindow('restore');
  }

  let lastLocation = lastState?.lastPath;

  if (openingLocation && openingLocation.path && openingLocation.name) {
    return await loadProjectFromLocation(openingLocation);
  }

  if (clipboardQuery) {
    return await loadProjectFromClipboardImage();
  }

  if (newProjectQuery.new) {
    return await loadNewProject(newProjectQuery);
  }

  if (globalConfig.default.open === 'last' && lastLocation && lastLocation.path && lastLocation.name) {
    try {
      return await loadProjectFromLocation(lastLocation);
    } catch (e) {
      logSystemError('Failed to load last project, falling back to a new project.', { label: LOG_LABEL, details: [e] });
      logUserError('failed to load last project. created a new project.', { label: LOG_LABEL, persistent: true });
      const createdNewProject = await loadNewProject();
      await notifyLastProjectFallback(e);
      return createdNewProject;
    }
  }

  return await loadNewProject();
}

export async function loadProjectFromLocation(loc: FileLocation): Promise<boolean> {
  if (!loc.path || !loc.name) {
    throw new Error('Failed to read project from path');
  }
  const path = normalizeJoin(loc.path, loc.name);
  if (loc.name?.endsWith('.sledge')) {
    // project file
    setFileStore('openAs', 'project');
    try {
      const projectFile = await readProjectFromPath(path);
      if (!projectFile) {
        throw new Error('Failed to read project from path: reading ' + path);
      }
      setSavedLocation(path);
      await loadProjectJson(projectFile);
      setProjectStore('isProjectChangedAfterSave', false);
      return false;
    } catch (error) {
      logSystemError('Failed to read project.', { label: LOG_LABEL, details: [path, error] });
      logUserError('failed to open project file.', { label: LOG_LABEL, details: [error], persistent: true });
      throw new Error('Failed to read project.\n' + error);
    }
  } else {
    // image file
    setFileStore('openAs', 'image');
    const isImportSuccessful = await loadProjectFromLocalImage(loc);
    if (isImportSuccessful) {
      setProjectStore('isProjectChangedAfterSave', false);
      return false;
    } else {
      logSystemError('Failed to import image from path.', { label: LOG_LABEL, details: [path] });
      logUserError('failed to import image.', { label: LOG_LABEL, persistent: true });
      throw new Error('Failed to import image from path:' + path);
    }
  }
}

async function loadNewProject(newProjectQuery?: { new: boolean; width?: number; height?: number }): Promise<boolean> {
  // create new (fallback)
  setFileStore('openAs', 'new_project');
  setProjectStore('loadProjectVersion', {
    project: CURRENT_PROJECT_VERSION,
    sledge: await getCurrentVersion(),
  });
  applyProjectLocation(undefined, 'new_project');
  const width = newProjectQuery?.width ?? globalConfig.default.canvasSize.width;
  const height = newProjectQuery?.height ?? globalConfig.default.canvasSize.height;
  setCanvasStore('canvas', 'width', width);
  setCanvasStore('canvas', 'height', height);
  eventBus.emit('canvas:sizeChanged', { newSize: { width, height } });
  addLayer(
    { name: 'layer 1', type: LayerType.Dot, enabled: true, dotMagnification: 1 },
    {
      noDiff: true,
      uniqueName: false,
    }
  );
  changeCanvasSizeWithNoOffset(globalConfig.default.canvasSize, true);
  setCanvasStore('canvas', globalConfig.default.canvasSize);
  const canvasSize = globalConfig.default.canvasSize;
  layerListStore.layers.forEach((layer) => {
    const buffer = new Uint8ClampedArray(canvasSize.width * canvasSize.height * 4);
    anvilManager.registerAnvil(layer.id, buffer, canvasSize.width, canvasSize.height);
  });
  setProjectStore('isProjectChangedAfterSave', false);
  return true;
}

async function notifyLastProjectFallback(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : undefined;
  const fallbackMessage = errorMessage && errorMessage.trim().length > 0 ? errorMessage : '<No message available>';
  await message(`Failed to reopen the last project. A new project was created instead.\n${fallbackMessage}`, {
    kind: 'warning',
    title: 'Project load',
    okLabel: 'OK',
  });
}
