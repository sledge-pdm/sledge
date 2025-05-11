import { trackStore } from '@solid-primitives/deep';
import { useLocation } from '@solidjs/router';
import { UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { confirm } from '@tauri-apps/plugin-dialog';
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import CanvasArea from '~/components/canvas/CanvasArea';
import EdgeInfo from '~/components/global/EdgeInfo';
import KeyListener from '~/components/global/KeyListener';
import Loading from '~/components/global/Loading';
import SideSections from '~/components/global/SideSections';
import { adjustZoomToFit, changeCanvasSize } from '~/controllers/canvas/CanvasController';
import { LayerAgentManager } from '~/controllers/layer/LayerAgentManager';
import { resetLayerImage } from '~/controllers/layer/LayerController';
import { addLayer } from '~/controllers/layer_list/LayerListController';
import { loadGlobalSettings } from '~/io/global_config/globalSettings';
import { importProjectFromPath } from '~/io/project/project';
import { LayerType } from '~/models/layer/Layer';
import { globalStore } from '~/stores/GlobalStores';
import { canvasStore, layerHistoryStore, layerListStore, projectStore, setCanvasStore, setProjectStore } from '~/stores/ProjectStores';
import { pageRoot } from '~/styles/global.css';
import { emitEvent, listenEvent, safeInvoke } from '~/utils/TauriUtils';
import { closeWindowsByLabel, WindowOptionsProp } from '~/utils/WindowUtils';

export const EditorWindowOptions: WindowOptionsProp = {
  width: 1200,
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

export const getImageOf = (layerId: string) => layerAgentManager.getAgent(layerId)?.getBuffer();

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
  const sp = new URLSearchParams(location.search);

  if (location.search && sp.get('new') !== 'true') {
    const fileName = sp.get('name');
    const filePath = sp.get('path');
    const path = `${filePath}\\${fileName}`;
    importProjectFromPath(path).then(() => {
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

  const onProjectLoad = async () => {
    await emitEvent('onProjectLoad');

    setProjectStore('isProjectChangedAfterSave', false);
    setIsLoading(false);
    await loadGlobalSettings();

    await emitEvent('onGlobalStoreLoad');

    if (isNewProject) {
      changeCanvasSize(globalStore.newProjectCanvasSize);
      setCanvasStore('canvas', globalStore.newProjectCanvasSize);

      layerListStore.layers.forEach((layer) => {
        resetLayerImage(layer.id, 1);
      });
    }

    await emitEvent('onSetup');

    adjustZoomToFit();

    listenEvent('onSettingsSaved', () => {
      loadGlobalSettings();
    });
  };

  const [isCloseRequested, SetIsCloseRequested] = createSignal(false);
  let unlisten: UnlistenFn;

  onMount(async () => {
    listenEvent("onSettingsSaved", () => {
      loadGlobalSettings();
    })

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
          await safeInvoke('open_window', { payload: { kind: 'start' } });
          closeWindowsByLabel('editor');
          SetIsCloseRequested(false);
        } else {
          event.preventDefault();
          SetIsCloseRequested(false);
        }
      } else {
        await safeInvoke('open_window', { payload: { kind: 'start' } });
        closeWindowsByLabel('editor');
        SetIsCloseRequested(false);
      }
    });
  });

  onCleanup(() => {
    unlisten();
  });

  return (
    <Show when={!isLoading()} fallback={<Loading />}>
      <div class={pageRoot}>
        <EdgeInfo />
        <SideSections />
        <div style={{ 'flex-grow': 1 }}>
          <CanvasArea />
        </div>

        <KeyListener />
        {/* <Companion /> */}
      </div>
    </Show>
  );
}
