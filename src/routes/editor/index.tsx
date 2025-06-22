import { trackStore } from '@solid-primitives/deep';
import { useLocation } from '@solidjs/router';
import { UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { confirm } from '@tauri-apps/plugin-dialog';
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import CanvasArea from '~/components/canvas/CanvasArea';
import KeyListener from '~/components/global/KeyListener';
import Loading from '~/components/global/Loading';
import SideSections from '~/components/global/SideSections';
import TopMenuBar from '~/components/global/TopMenuBar';
import { adjustZoomToFit, changeCanvasSize } from '~/controllers/canvas/CanvasController';
import { resetLayerImage } from '~/controllers/layer/LayerController';
import { addLayer } from '~/controllers/layer/LayerListController';
import loadGlobalSettings from '~/io/config/in/load';
import { initProjectWithNewImage } from '~/io/image/in/open';
import { importProjectFromPath } from '~/io/project/in/import';
import { LayerType } from '~/models/layer/Layer';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore, layerListStore, projectStore, setCanvasStore, setProjectStore } from '~/stores/ProjectStores';
import { pageRoot } from '~/styles/global.css';
import { flexCol } from '~/styles/snippets.css';
import { eventBus } from '~/utils/EventBus';
import { emitEvent, listenEvent } from '~/utils/TauriUtils';

export default function Editor() {
  const location = useLocation();

  createEffect(() => {
    trackStore(canvasStore.canvas);
    trackStore(layerListStore);
    setProjectStore('isProjectChangedAfterSave', true);
  });

  const isNewProject = location.search === '';
  const [isLoading, setIsLoading] = createSignal(true);

  const onProjectLoad = async () => {
    await emitEvent('onProjectLoad');

    setProjectStore('isProjectChangedAfterSave', false);
    await loadGlobalSettings();

    await emitEvent('onGlobalStoreLoad');
    setIsLoading(false);

    if (isNewProject) {
      changeCanvasSize(globalConfig.default.canvasSize);
      setCanvasStore('canvas', globalConfig.default.canvasSize);

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

  const sp = new URLSearchParams(location.search);

  if (location.search && sp.get('new') !== 'true') {
    const fileName = sp.get('name');
    const filePath = sp.get('path');
    if (!fileName || !filePath) return;
    const path = `${filePath}\\${fileName}`;
    if (fileName?.endsWith('.sledge')) {
      importProjectFromPath(path).then(() => {
        onProjectLoad();
      });
    } else {
      // 画像データ
      const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');
      setProjectStore('name', fileNameWithoutExtension);
      initProjectWithNewImage(filePath, fileName).then(() => {
        onProjectLoad();
      });
    }
  } else {
    // create new
    setProjectStore('name', 'new project');
    if (sp.has('width') && sp.has('height')) {
      const width = Number(sp.get('width'));
      const height = Number(sp.get('height'));
      setCanvasStore('canvas', 'width', width);
      setCanvasStore('canvas', 'height', height);
      eventBus.emit('canvas:sizeChanged', { newSize: { width, height } });
    }
    addLayer({ name: 'dot', type: LayerType.Dot, enabled: true, dotMagnification: 1 });
    onProjectLoad();
  }

  let unlisten: UnlistenFn;

  onMount(async () => {
    listenEvent('onSettingsSaved', () => {
      loadGlobalSettings();
    });

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
