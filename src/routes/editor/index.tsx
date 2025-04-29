import { trackStore } from '@solid-primitives/deep';
import { useLocation } from '@solidjs/router';
import { UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { confirm } from '@tauri-apps/plugin-dialog';
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import CanvasArea from '~/components/canvas/CanvasArea';
import EdgeInfo from '~/components/global/EdgeInfo';
import Loading from '~/components/global/Loading';
import SideSections from '~/components/global/SideSections';
import { adjustZoomToFit, centeringCanvas, changeCanvasSize } from '~/controllers/canvas/CanvasController';
import KeyListener from '~/controllers/config/KeyListener';
import { resetLayerImage } from '~/controllers/layer/LayerController';
import { addLayer } from '~/controllers/layer_list/LayerListController';
import { loadGlobalSettings } from '~/io/global_config/globalSettings';
import { importProjectJsonFromPath } from '~/io/project/project';
import { LayerImageManager as LayerAgentManager } from '~/models/layer_image/LayerImageManager';
import { globalStore } from '~/stores/GlobalStores';
import {
  canvasStore,
  layerHistoryStore,
  layerListStore,
  projectStore,
  setCanvasStore,
  setProjectStore,
} from '~/stores/ProjectStores';

import { pageRoot } from '~/styles/global.css';
import { LayerType } from '~/types/Layer';
import { closeWindowsByLabel, openStartWindow, WindowOptionsProp } from '~/utils/windowUtils';

export const EditorWindowOptions: WindowOptionsProp = {
  width: 1000,
  height: 750,
  acceptFirstMouse: true,
  resizable: true,
  closable: true,
  maximizable: true,
  minimizable: true,
  decorations: false,
  fullscreen: false,
};

export const layerAgentManager = new LayerAgentManager();

export const getImageOf = (layerId: string) => layerAgentManager.getAgent(layerId)?.getImage();

export default function Editor() {
  const window = getCurrentWebviewWindow();
  const location = useLocation();

  createEffect(() => {
    trackStore(canvasStore.canvas);
    trackStore(layerHistoryStore);
    trackStore(layerListStore);
    setProjectStore('isProjectChangedAfterSave', true);
  });

  const isNewProject = location.search === '';
  const [isLoading, setIsLoading] = createSignal(true);

  const onProjectLoad = async () => {
    setProjectStore('isProjectChangedAfterSave', false);
    setIsLoading(false);

    await loadGlobalSettings();

    if (isNewProject) {
      changeCanvasSize(globalStore.newProjectCanvasSize);
      setCanvasStore('canvas', globalStore.newProjectCanvasSize);

      layerListStore.layers.forEach((layer) => {
        resetLayerImage(layer.id, 1);
      });
    }

    adjustZoomToFit();
  };

  const sp = new URLSearchParams(location.search);

  if (location.search && sp.get('new') !== 'true') {
    const fileName = sp.get('name');
    const filePath = sp.get('path');
    const path = `${filePath}\\${fileName}`;
    importProjectJsonFromPath(path).then(() => {
      onProjectLoad();
    });
  } else {
    // create new
    setProjectStore('name', 'new project');
    if (sp.has('width') && sp.has('height')) {
      setCanvasStore('canvas', 'width', Number(sp.get('width')));
      setCanvasStore('canvas', 'height', Number(sp.get('height')));
    }
    addLayer('dot', LayerType.Dot, true, 1).then(() => {
      onProjectLoad();
    });
  }

  const [isCloseRequested, SetIsCloseRequested] = createSignal(false);
  let unlisten: UnlistenFn;

  onMount(async () => {
    unlisten = await window.onCloseRequested(async (event) => {
      if (isCloseRequested()) {
        event.preventDefault();
        return;
      }
      SetIsCloseRequested(true);
      event.preventDefault();
      if (projectStore.isProjectChangedAfterSave) {
        const confirmed = await confirm('the project is not saved.\nsure to quit without save?', {
          okLabel: 'quit w/o save.',
          cancelLabel: 'cancel.',
        });
        if (confirmed) {
          await openStartWindow();
          closeWindowsByLabel('editor');
          SetIsCloseRequested(false);
        } else {
          event.preventDefault();
          SetIsCloseRequested(false);
        }
      } else {
        await openStartWindow();
        closeWindowsByLabel('editor');
        SetIsCloseRequested(false);
      }
    });
  });

  onCleanup(() => {
    unlisten();
  });

  return (
    <>
      {isLoading() && <Loading />}

      {!isLoading() && (
        <div class={pageRoot}>
          <EdgeInfo />
          <SideSections />
          <div style={{ 'flex-grow': 1 }}>
            <CanvasArea />
          </div>

          <KeyListener />
          {/* <Companion /> */}
        </div>
      )}
    </>
  );
}
