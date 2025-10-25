import { FileLocation } from '@sledge/core';
import { getEmergencyBackups } from '~/features/backup';
import { changeCanvasSizeWithNoOffset } from '~/features/canvas';
import { setSavedLocation } from '~/features/config';
import { importImageFromPath } from '~/features/io/image/in/import';
import { readProjectFromPath } from '~/features/io/project/in/import';
import { loadProjectJson } from '~/features/io/project/in/load';
import { CURRENT_PROJECT_VERSION } from '~/features/io/types/Project';
import { addLayer, LayerType } from '~/features/layer';
import { anvilManager } from '~/features/layer/anvil/AnvilManager';
import { setFileStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { layerListStore, setCanvasStore, setProjectStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { normalizeJoin } from '~/utils/FileUtils';
import { getCurrentVersion } from '~/utils/VersionUtils';
import { getNewProjectQuery, getOpenLocation, openWindow } from '~/utils/WindowUtils';

export async function tryLoadProject(lastState?: { lastOpenAs?: 'project' | 'new_project' | 'image'; lastPath?: FileLocation }): Promise<boolean> {
  const openingLocation = getOpenLocation();
  const newProjectQuery = getNewProjectQuery();

  const emergencyBackups = await getEmergencyBackups();
  if (emergencyBackups && emergencyBackups.length > 0) {
    await openWindow('restore');
  }

  let lastLocation = lastState?.lastPath;

  if (openingLocation && openingLocation.path && openingLocation.name) {
    return await loadProjectFromLocation(openingLocation);
  } else if (newProjectQuery.new) {
    return await loadNewProject(newProjectQuery);
  } else if (globalConfig.default.open === 'last' && lastLocation && lastLocation.path && lastLocation.name) {
    return await loadProjectFromLocation(lastLocation);
  } else {
    // fallback
    return await loadNewProject();
  }

  throw new Error('unknown error');
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
        console.error('Failed to read project from path:', path);
        throw new Error('Failed to read project from path: reading ' + path);
      }
      setSavedLocation(path);
      await loadProjectJson(projectFile);
      setProjectStore('isProjectChangedAfterSave', true);
      return false;
    } catch (error) {
      console.error('Failed to read project:', error);
      throw new Error('Failed to read project.\n' + error);
    }
  } else {
    // image file
    setFileStore('openAs', 'image');
    const isImportSuccessful = await importImageFromPath(loc);
    if (isImportSuccessful) {
      setProjectStore('isProjectChangedAfterSave', true);
      return false;
    } else {
      console.error('Failed to import image from path:', path);
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
  setFileStore('savedLocation', {
    name: undefined,
    path: undefined,
  });
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
