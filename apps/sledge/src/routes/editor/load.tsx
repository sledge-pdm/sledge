import { getEmergencyBackups, getLastOpenedProjects } from '~/features/backup';
import { changeCanvasSizeWithNoOffset } from '~/features/canvas';
import { setSavedLocation } from '~/features/config';
import { importImageFromPath } from '~/features/io/image/in/import';
import { readProjectFromPath } from '~/features/io/project/in/import';
import { loadProjectJson } from '~/features/io/project/in/load';
import { addLayer, LayerType } from '~/features/layer';
import { anvilManager } from '~/features/layer/anvil/AnvilManager';
import { setFileStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { layerListStore, projectStore, setCanvasStore, setProjectStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { normalizeJoin } from '~/utils/FileUtils';
import { getNewProjectQuery, getOpenLocation, openWindow } from '~/utils/WindowUtils';

export async function tryLoadProject(): Promise<boolean> {
  const openingLocation = getOpenLocation();
  const newProjectQuery = getNewProjectQuery();

  const emergencyBackups = await getEmergencyBackups();
  if (emergencyBackups && emergencyBackups.length > 0) {
    await openWindow('restore');
  }

  let lastLocation = undefined;
  // If not launched from file + not new project + default open is last, check if backup exists
  if (!openingLocation && !newProjectQuery.new && globalConfig.default.open === 'last') {
    const lastOpenedProjects = await getLastOpenedProjects();
    if (lastOpenedProjects && lastOpenedProjects.length > 0) {
      lastLocation = lastOpenedProjects[0];
    }
  }

  if (openingLocation && openingLocation.path && openingLocation.name) {
    const fullPath = normalizeJoin(openingLocation.path, openingLocation.name);
    if (openingLocation.name?.endsWith('.sledge')) {
      try {
        const projectFile = await readProjectFromPath(fullPath);
        if (!projectFile) {
          console.error('Failed to read project from path:', fullPath);
          throw new Error('reading ' + fullPath);
        }
        setSavedLocation(fullPath);
        await loadProjectJson(projectFile);
        setProjectStore('isProjectChangedAfterSave', true);
        return false;
      } catch (error) {
        console.error('Failed to read project:', error);
        throw new Error('Failed to read project.\n' + error);
      }
    } else {
      // image file
      const isImportSuccessful = await importImageFromPath(openingLocation);
      if (isImportSuccessful) {
        setProjectStore('isProjectChangedAfterSave', true);
        return false;
      } else {
        console.error('Failed to import image from path:', openingLocation);
        throw new Error(
          'Failed to import image from path:' + normalizeJoin(openingLocation.path ?? '<unknown path>', openingLocation.name ?? '<unknown file>')
        );
      }
    }
  } else if (lastLocation && lastLocation.path && lastLocation.name) {
    const fullPath = normalizeJoin(lastLocation.path, lastLocation.name);
    if (lastLocation.name?.endsWith('.sledge')) {
      try {
        const projectFile = await readProjectFromPath(fullPath);
        if (!projectFile) {
          console.error('Failed to read project from path:', fullPath);
          throw new Error('reading ' + fullPath);
        }
        // Don't set location to backup
        // setLocation(fullPath);
        await loadProjectJson(projectFile);

        // if restored project that already saved, set its path (not backup path!) to location
        if (projectStore.lastSavedPath) setSavedLocation(projectStore.lastSavedPath);
        // set project as dirty because it's just a backup
        setProjectStore('isProjectChangedAfterSave', true);
        return false;
      } catch (error) {
        console.error('Failed to read project:', error);
        throw new Error('Failed to read project.\n' + error);
      }
    }
  } else {
    // create new
    setFileStore('savedLocation', {
      name: undefined,
      path: undefined,
    });
    const width = newProjectQuery.width ?? globalConfig.default.canvasSize.width;
    const height = newProjectQuery.height ?? globalConfig.default.canvasSize.height;
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

  throw new Error('unknown error');
}
