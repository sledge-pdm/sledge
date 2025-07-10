import { FileLocation, flexCol } from '@sledge/core';
import { pageRoot } from '@sledge/theme';
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
import { initProjectWithNewImage } from '~/io/image/in/open';
import { readProjectDataFromWindow } from '~/io/project/in/import';
import { loadProjectJson } from '~/io/project/in/load';
import { LayerType } from '~/models/layer/Layer';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore, layerListStore, projectStore, setCanvasStore, setProjectStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { PathToFileLocation } from '~/utils/PathUtils';
import { emitEvent } from '~/utils/TauriUtils';

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
    setProjectStore('isProjectChangedAfterSave', false);
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
  };

  // プロジェクトデータがRust側で既に読み込まれているかチェック
  const preloadedProject = readProjectDataFromWindow();

  let openedFile: FileLocation | undefined = undefined;
  if ((window as any).openedFiles && Array.isArray((window as any).openedFiles)) {
    const files = (window as any).openedFiles as string[];
    if (files.length > 0) openedFile = PathToFileLocation(files[0]);
  }

  const sp = new URLSearchParams(location.search);

  if (preloadedProject) {
    // Rust側で既に読み込まれたプロジェクトデータを使用
    console.log('Using preloaded project data from Rust');

    // 既存のloadProjectJsonを使用
    loadProjectJson(preloadedProject);

    onProjectLoad(false);
  } else if (openedFile) {
    const path = `${openedFile.path}\\${openedFile.name}`;
    if (openedFile.name.endsWith('.sledge')) {
      // .sledgeファイルはRust側で読み込まれるべき
      console.error('Project file not preloaded by Rust', `${openedFile.path}\\${openedFile.name}`);
    } else {
      // 画像データ
      const fileNameWithoutExtension = openedFile.name.replace(/\.[^/.]+$/, '');
      setProjectStore('name', fileNameWithoutExtension);
      initProjectWithNewImage(openedFile.path, openedFile.name).then(() => {
        onProjectLoad(false);
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
