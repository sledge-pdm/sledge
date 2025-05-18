import { trackStore } from '@solid-primitives/deep';
import { useLocation } from '@solidjs/router';
import { UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { confirm } from '@tauri-apps/plugin-dialog';
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import CanvasArea from '~/components/canvas/CanvasArea';
import KeyListener from '~/components/global/KeyListener';
import Loading from '~/components/global/Loading';
import SideSections from '~/components/global/SideSections';
import TopMenuBar from '~/components/global/TopMenuBar';
import { adjustZoomToFit, changeCanvasSize } from '~/controllers/canvas/CanvasController';
import { resetLayerImage } from '~/controllers/canvas/layer/LayerController';
import { addLayer } from '~/controllers/canvas/layer/LayerListController';
import { loadGlobalSettings } from '~/io/global_config/globalSettings';
import { importProjectFromPath } from '~/io/project/importProject';
import { LayerType } from '~/models/canvas/layer/Layer';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore, layerHistoryStore, layerListStore, projectStore, setCanvasStore, setProjectStore } from '~/stores/ProjectStores';
import { pageRoot } from '~/styles/global.css';
import { flexCol } from '~/styles/snippets.css';
import { emitEvent, listenEvent } from '~/utils/TauriUtils';

export default function Editor() {
  const wvWindow = getCurrentWebviewWindow();
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
    await loadGlobalSettings();

    await emitEvent('onGlobalStoreLoad');
    setIsLoading(false);

    if (isNewProject) {
      changeCanvasSize(globalConfig.newProject.canvasSize);
      setCanvasStore('canvas', globalConfig.newProject.canvasSize);

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

  let unlisten: UnlistenFn;

  onMount(async () => {
    listenEvent('onSettingsSaved', () => {
      loadGlobalSettings();
    });

    unlisten = await wvWindow.onCloseRequested(async (event) => {
      if (projectStore.isProjectChangedAfterSave) {
        const confirmed = await confirm('the project is not saved.\nsure to quit without save?', {
          okLabel: 'quit w/o save.',
          cancelLabel: 'cancel.',
        });
        if (!confirmed) {
          event.preventDefault();
        }
      }
    });
  });

  onCleanup(() => {
    unlisten();

    if (import.meta.hot) {
      window.location.reload();
    }
  });

  return (
    <Show when={!isLoading()} fallback={<Loading />}>
      <div class={flexCol}>
        <TopMenuBar />
        <div
          class={pageRoot}
          style={{
            'margin-top': '28px',
            height: '100dvh',
          }}
        >
          {/* <EdgeInfo /> */}
          <SideSections />
          <div style={{ 'flex-grow': 1 }}>
            <CanvasArea />
          </div>

          <KeyListener />
          {/* <Companion /> */}
        </div>
      </div>
    </Show>
  );
}
