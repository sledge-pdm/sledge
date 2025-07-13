import { FileLocation } from '@sledge/core';
import { pageRoot, vars } from '@sledge/theme';
import { trackStore } from '@solid-primitives/deep';
import { useLocation } from '@solidjs/router';
import { UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { confirm } from '@tauri-apps/plugin-dialog';
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import CanvasArea from '~/components/canvas/CanvasArea';
import BottomInfo from '~/components/global/BottomInfo';
import KeyListener from '~/components/global/KeyListener';
import Loading from '~/components/global/Loading';
import SideSections from '~/components/global/SideSections';
import { adjustZoomToFit, changeCanvasSize } from '~/controllers/canvas/CanvasController';
import { resetLayerImage } from '~/controllers/layer/LayerController';
import { addLayer } from '~/controllers/layer/LayerListController';
import { importImageFromWindow } from '~/io/image/in/import';
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

  const preloadedProject = readProjectDataFromWindow();
  if (preloadedProject) {
    // Rust側で既に読み込まれたプロジェクトデータを使用
    console.log('Using preloaded project data from Rust');

    // 既存のloadProjectJsonを使用
    loadProjectJson(preloadedProject);

    onProjectLoad(false);
  } else if (importImageFromWindow()) {
    onProjectLoad(false);
  } else {
    const sp = new URLSearchParams(location.search);
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
        <SideSections side='leftSide' />

        {divider()}

        <div style={{ 'flex-grow': 1, position: 'relative' }}>
          <CanvasArea />
          <BottomInfo />
        </div>
{/* 
        {divider()}

        <SideSections side='rightSide' /> */}

        <KeyListener />
        {/* <Companion /> */}
      </div>
    </Show>
  );
}
