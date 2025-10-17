import { color } from '@sledge/theme';
import { trackStore } from '@solid-primitives/deep';
import { useSearchParams } from '@solidjs/router';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { confirm } from '@tauri-apps/plugin-dialog';
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import CanvasArea from '~/components/canvas/CanvasArea';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import ClipboardListener from '~/components/global/ClipboardListener';
import FloatingController from '~/components/global/controller/FloatingController';
import KeyListener from '~/components/global/KeyListener';
import Loading from '~/components/global/Loading';
import SideSectionControl from '~/components/section/SideSectionControl';
import { getEmergencyBackups, getLastOpenedProjects, saveLastProject } from '~/features/backup';
import { adjustZoomToFit, changeCanvasSizeWithNoOffset } from '~/features/canvas';
import { loadToolPresets, setLocation } from '~/features/config';
import { addToImagePool } from '~/features/image_pool';
import { AutoSaveManager } from '~/features/io/AutoSaveManager';
import { loadGlobalSettings } from '~/features/io/config/load';
import { importableFileExtensions } from '~/features/io/FileExtensions';
import { importImageFromPath } from '~/features/io/image/in/import';
import { readProjectFromPath } from '~/features/io/project/in/import';
import { loadProjectJson } from '~/features/io/project/in/load';
import { openExistingProject } from '~/features/io/window';
import { addLayer, LayerType } from '~/features/layer';
import { anvilManager } from '~/features/layer/anvil/AnvilManager';
import { setFileStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore, layerListStore, projectStore, setCanvasStore, setProjectStore } from '~/stores/ProjectStores';
import { flexCol, pageRoot } from '~/styles/styles';
import { eventBus } from '~/utils/EventBus';
import { join, pathToFileLocation } from '~/utils/FileUtils';
import { emitEvent } from '~/utils/TauriUtils';
import { getNewProjectQuery, getOpenLocation, openWindow, reportAppStartupError, reportWindowStartError, showMainWindow } from '~/utils/WindowUtils';

export default function Editor() {
  const [sp, setSp] = useSearchParams();
  const isFirstStartup = sp.startup === 'true';

  createEffect(() => {
    trackStore(canvasStore.canvas);
    trackStore(layerListStore);
    setProjectStore('isProjectChangedAfterSave', true);
  });

  onCleanup(() => {
    if (!import.meta.hot) {
      webGLRenderer?.dispose();
    }
  });

  const [isLoading, setIsLoading] = createSignal(true);

  const onProjectLoad = async (isNewProject: boolean) => {
    await emitEvent('onProjectLoad');

    await loadGlobalSettings();
    await loadToolPresets();

    if (isNewProject) {
      changeCanvasSizeWithNoOffset(globalConfig.default.canvasSize, true);
      setCanvasStore('canvas', globalConfig.default.canvasSize);
      const canvasSize = globalConfig.default.canvasSize;
      layerListStore.layers.forEach((layer) => {
        const buffer = new Uint8ClampedArray(canvasSize.width * canvasSize.height * 4);
        anvilManager.registerAnvil(layer.id, buffer, canvasSize.width, canvasSize.height);
      });
      setProjectStore('isProjectChangedAfterSave', false);
    } else {
      // if it's not a new project, explicitly set project dirty
      // (in order to prevent backup loss)
      setProjectStore('isProjectChangedAfterSave', true);
    }

    setIsLoading(false);

    await emitEvent('onSetup');
    adjustZoomToFit();

    await showMainWindow();
  };

  const tryLoadProject = async (): Promise<boolean> => {
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
      const fullPath = join(openingLocation.path, openingLocation.name);
      if (openingLocation.name?.endsWith('.sledge')) {
        try {
          const projectFile = await readProjectFromPath(fullPath);
          if (!projectFile) {
            console.error('Failed to read project from path:', fullPath);
            throw new Error('reading ' + fullPath);
          }
          setLocation(fullPath);
          await loadProjectJson(projectFile);
          return false;
        } catch (error) {
          console.error('Failed to read project:', error);
          throw new Error('Failed to read project.\n' + error);
        }
      } else {
        // image file
        const isImportSuccessful = await importImageFromPath(openingLocation);
        if (isImportSuccessful) {
          return false;
        } else {
          console.error('Failed to import image from path:', openingLocation);
          throw new Error(
            'Failed to import image from path:' + join(openingLocation.path ?? '<unknown path>', openingLocation.name ?? '<unknown file>')
          );
        }
      }
    } else if (lastLocation && lastLocation.path && lastLocation.name) {
      const fullPath = join(lastLocation.path, lastLocation.name);
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
          if (projectStore.lastSavedPath) setLocation(projectStore.lastSavedPath);
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
      return true;
    }

    throw new Error('unknown error');
  };

  let unlisten: UnlistenFn;

  onMount(async () => {
    unlisten = await getCurrentWindow().onCloseRequested(async (event) => {
      const loc = await saveLastProject();

      if (loc === undefined) {
        const confirmed = await confirm('Failed to save unsaved state. Quit sledge anyway?\n(unsaved changes will be discarded.)', {
          kind: 'error',
          okLabel: 'Discard and quit',
          cancelLabel: 'Cancel',
        });
        if (!confirmed) {
          event.preventDefault();
          return;
        }
      }

      // if (!isLoading() && projectStore.isProjectChangedAfterSave) {
      //   const confirmed = await confirm('There are unsaved changes.\nSure to quit without save?', {
      //     kind: 'warning',
      //     title: 'Unsaved Changes',
      //     okLabel: 'Quit without save.',
      //     cancelLabel: 'Cancel.',
      //   });
      //   if (!confirmed) {
      //     event.preventDefault();
      //     return;
      //   }
      // }
    });

    try {
      const isNewProject = await tryLoadProject();
      await onProjectLoad(isNewProject);
    } catch (e) {
      unlisten();

      // 初回起動時のみ特別(ウィンドウだけ消すとプロセスだけが残ってしまうので、プロセスをキルするreportを行う)
      if (isFirstStartup) await reportAppStartupError(e);
      else await reportWindowStartError(e);
    }
  });

  createEffect(() => {
    if (projectStore.autoSaveEnabled && projectStore.autoSaveInterval) {
      const manager = AutoSaveManager.getInstance();
      if (projectStore.autoSaveInterval === manager.getCurrentInterval()) return;
      manager.startAutoSave(projectStore.autoSaveInterval);
    }
  });

  onCleanup(() => {
    AutoSaveManager.getInstance().stopAutoSave();
    unlisten();

    if (import.meta.hot) {
      window.location.reload();
    }
  });

  listen('tauri://drag-drop', async (e: any) => {
    const paths = e.payload.paths as string[];
    addToImagePool(paths.filter((p) => importableFileExtensions.some((ext) => p.endsWith(`.${ext}`))));

    paths
      .filter((p) => p.endsWith('.sledge'))
      .forEach((p) => {
        const loc = pathToFileLocation(p);
        if (loc) openExistingProject(loc);
      });
  });

  return (
    <Show when={!isLoading()} fallback={<Loading />}>
      <div class={pageRoot}>
        <SideSectionControl side='leftSide' />

        <div class={flexCol} style={{ 'flex-grow': 1, position: 'relative' }}>
          <div style={{ 'flex-grow': 1, 'background-color': color.canvasArea }}>
            <CanvasArea />
          </div>
        </div>

        <SideSectionControl side='rightSide' />

        <FloatingController />

        <KeyListener />
        <ClipboardListener />
        {/* <Companion /> */}
      </div>
    </Show>
  );
}
