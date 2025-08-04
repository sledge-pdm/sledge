import { FileLocation, flexCol } from '@sledge/core';
import { pageRoot, vars } from '@sledge/theme';
import { trackStore } from '@solid-primitives/deep';
import { useLocation } from '@solidjs/router';
import { UnlistenFn } from '@tauri-apps/api/event';
import { join } from '@tauri-apps/api/path';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { confirm } from '@tauri-apps/plugin-dialog';
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import CanvasArea from '~/components/canvas/CanvasArea';
import KeyListener from '~/components/global/KeyListener';
import Loading from '~/components/global/Loading';
import SideSectionControl from '~/components/section/SideSectionControl';
import { adjustZoomToFit, changeCanvasSize } from '~/controllers/canvas/CanvasController';
import { resetLayerImage } from '~/controllers/layer/LayerController';
import { addLayer } from '~/controllers/layer/LayerListController';
import { AutoSaveManager } from '~/controllers/project/AutoSaveManager';
import { importImageFromPath } from '~/io/image/in/import';
import { readProjectFromPath } from '~/io/project/in/import';
import { loadProjectJson } from '~/io/project/in/load';
import { LayerType } from '~/models/layer/Layer';
import { setFileStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore, layerListStore, projectStore, setCanvasStore, setProjectStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { PathToFileLocation } from '~/utils/PathUtils';
import { emitEvent } from '~/utils/TauriUtils';
import { getOpenLocation } from '~/utils/WindowUtils';

export default function Editor() {
  const location = useLocation();

  createEffect(() => {
    trackStore(canvasStore.canvas);
    trackStore(layerListStore);
    setProjectStore('isProjectChangedAfterSave', true);
  });

  const [isLoading, setIsLoading] = createSignal(true);

  const onProjectLoad = async (isNewProject: boolean) => {
    await emitEvent('onProjectLoad');
    if (isNewProject) {
      changeCanvasSize(globalConfig.default.canvasSize);
      setCanvasStore('canvas', globalConfig.default.canvasSize);
      layerListStore.layers.forEach((layer) => {
        resetLayerImage(layer.id, 1);
      });
    }
    setProjectStore('isProjectChangedAfterSave', false);

    setIsLoading(false);

    await emitEvent('onSetup');
    adjustZoomToFit();
  };

  let openedFile: FileLocation | undefined = undefined;
  if ((window as any).openedFiles && Array.isArray((window as any).openedFiles)) {
    const files = (window as any).openedFiles as string[];
    if (files.length > 0) openedFile = PathToFileLocation(files[0]);
  }

  // const preloadedProject = readProjectDataFromWindow();
  const fileLocation = getOpenLocation();
  if (fileLocation && fileLocation.path && fileLocation.name) {
    if (fileLocation.name?.endsWith('.sledge')) {
      setFileStore('location', fileLocation);
      join(fileLocation.path, fileLocation.name).then((path) => {
        readProjectFromPath(path)
          .then((projectFile) => {
            if (!projectFile) {
              console.error('Failed to read project from path:', path);
              return;
            }
            loadProjectJson(projectFile);
            onProjectLoad(false);
          })
          .catch((error) => {
            console.error('Failed to read project:', error);
          });
      });
    } else {
      // image file
      importImageFromPath(fileLocation).then((success) => {
        if (success) {
          setFileStore('location', fileLocation);
          onProjectLoad(false);
        } else {
          console.error('Failed to import image from path:', fileLocation);
        }
      });
    }
  } else {
    const sp = new URLSearchParams(location.search);
    // create new
    setFileStore('location', {
      name: undefined,
      path: undefined,
    });

    if (sp.has('width') && sp.has('height')) {
      const width = Number(sp.get('width'));
      const height = Number(sp.get('height'));
      setCanvasStore('canvas', 'width', width);
      setCanvasStore('canvas', 'height', height);
      eventBus.emit('canvas:sizeChanged', { newSize: { width, height } });
    }
    addLayer({ name: 'layer1', type: LayerType.Dot, enabled: true, dotMagnification: 1 });
    onProjectLoad(true);
  }

  let unlisten: UnlistenFn;

  onMount(async () => {
    unlisten = await getCurrentWindow().onCloseRequested(async (event) => {
      if (!isLoading() && projectStore.isProjectChangedAfterSave) {
        const confirmed = await confirm('the project is not saved.\nsure to quit without save?', {
          okLabel: 'quit w/o save.',
          cancelLabel: 'cancel.',
        });
        if (!confirmed) {
          event.preventDefault();
          return;
        }
      }
    });
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

  const divider = () => (
    <div
      style={{
        width: '1px',
        height: '100%',
        'background-color': vars.color.border,
      }}
    />
  );

  return (
    <Show when={!isLoading()} fallback={<Loading />}>
      <div class={pageRoot}>
        <SideSectionControl side='leftSide' />

        <div class={flexCol} style={{ 'flex-grow': 1, position: 'relative' }}>
          <div style={{ 'flex-grow': 1 }}>
            <CanvasArea />
          </div>
        </div>

        <SideSectionControl side='rightSide' />

        <KeyListener />
        {/* <Companion /> */}
      </div>
    </Show>
  );
}
