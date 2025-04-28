import { trackStore } from '@solid-primitives/deep';
import { useLocation } from '@solidjs/router';
import { UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { confirm } from '@tauri-apps/plugin-dialog';
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import CanvasArea from '~/components/canvas/CanvasArea';
import EdgeInfo from '~/components/EdgeInfo';
import SideSections from '~/components/SideSections';
import {
  adjustZoomToFit,
  centeringCanvas,
} from '~/controllers/canvas/CanvasController';
import resetLayerImage from '~/controllers/layer/LayerController';
import { addLayer } from '~/controllers/layer_list/LayerListController';
import { loadGlobalSettings } from '~/io/global/globalIO';
import { importProjectJsonFromPath } from '~/io/project/project';
import { LayerImageManager } from '~/models/layer_image/LayerImageManager';
import { canvasStore } from '~/stores/project/canvasStore';
import {
  layerHistoryStore,
  layerListStore,
  projectStore,
  setProjectStore,
} from '~/stores/ProjectStores';

import { pageRoot } from '~/styles/global.css';
import { LayerType } from '~/types/Layer';
import {
  closeWindowsByLabel,
  openStartWindow,
  WindowOptionsProp,
} from '~/utils/windowUtils';

export const EditorWindowOptions: WindowOptionsProp = {
  width: 1200,
  height: 800,
  acceptFirstMouse: true,
  resizable: true,
  closable: true,
  maximizable: true,
  minimizable: true,
  decorations: false,
  fullscreen: false,
};

export const layerImageManager = new LayerImageManager();

export const getImageOf = (layerId: string) =>
  layerImageManager.getAgent(layerId)?.getImage();

export default function Editor() {
  const window = getCurrentWebviewWindow();
  const location = useLocation();

  const [isLoading, setIsLoading] = createSignal(true);

  const onProjectLoad = () => {
    createEffect(() => {
      trackStore(canvasStore.canvas);
      trackStore(layerHistoryStore);
      trackStore(layerListStore);
      setProjectStore('isProjectChangedAfterSave', true);
    });
    setProjectStore('isProjectChangedAfterSave', false);
    setIsLoading(false);
  };

  if (location.search) {
    const sp = new URLSearchParams(location.search);
    const fileName = sp.get('name');
    const filePath = sp.get('path');
    const path = `${filePath}\\${fileName}`;
    importProjectJsonFromPath(path).then(() => {
      onProjectLoad();
    });
  } else {
    // create new
    setProjectStore('name', 'new project');
    addLayer('dot', LayerType.Dot, true, 1).then(() => {
      onProjectLoad();
    });
  }

  const [isCloseRequested, SetIsCloseRequested] = createSignal(false);
  let unlisten: UnlistenFn;

  onMount(async () => {
    adjustZoomToFit();
    centeringCanvas();
    loadGlobalSettings();

    layerListStore.layers.forEach((layer) => {
      resetLayerImage(layer.id, 1);
    });

    unlisten = await window.onCloseRequested(async (event) => {
      if (isCloseRequested()) {
        event.preventDefault();
        return;
      }
      SetIsCloseRequested(true);
      event.preventDefault();
      if (projectStore.isProjectChangedAfterSave) {
        const confirmed = await confirm(
          'the project is not saved.\nsure to quit without save?',
          {
            okLabel: 'quit w/o save.',
            cancelLabel: 'cancel.',
          }
        );
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
      {isLoading() && (
        <div class={pageRoot}>
          <p style={{ 'font-size': '2rem' }}>please wait.</p>
        </div>
      )}

      {!isLoading() && (
        <div class={pageRoot}>
          <EdgeInfo />
          <SideSections />
          <div style={{ 'flex-grow': 1 }}>
            <CanvasArea />
          </div>
          {/* <Companion /> */}
        </div>
      )}
    </>
  );
}
