import { color } from '@sledge/theme';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createEffect, createSignal, onMount, Show } from 'solid-js';
import CanvasArea from '~/components/canvas/CanvasArea';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import AnalogSticks from '~/components/global/analog_sticks/AnalogSticks';
import ClipboardListener from '~/components/global/ClipboardListener';
import KeyListener from '~/components/global/KeyListener';
import Loading from '~/components/global/Loading';
import SideSectionControl from '~/components/section/SideSectionControl';
import { adjustZoomToFit } from '~/features/canvas';
import { addToImagePool } from '~/features/image_pool';
import { loadGlobalSettings } from '~/features/io/config/load';
import { loadEditorState } from '~/features/io/editor/load';
import { importableFileExtensions } from '~/features/io/FileExtensions';
import { openExistingProject } from '~/features/io/window';
import { AutoSnapshotManager } from '~/features/snapshot/AutoSnapshotManager';
import { handleCloseRequest } from '~/routes/editor/close';
import { tryLoadProject } from '~/routes/editor/load';
import { projectStore } from '~/stores/ProjectStores';
import { flexCol, pageRoot } from '~/styles/styles';
import { pathToFileLocation } from '~/utils/FileUtils';
import { isFirstStartup, reportAppStartupError, reportWindowStartError, showMainWindow } from '~/utils/WindowUtils';

export default function Editor() {
  const isFirst = isFirstStartup();

  const [isLoading, setIsLoading] = createSignal(true);

  let unlisten: UnlistenFn;

  onMount(async () => {
    unlisten = await getCurrentWindow().onCloseRequested(handleCloseRequest);
    try {
      await loadGlobalSettings();
      const lastState = await loadEditorState();
      await tryLoadProject(lastState);
      setIsLoading(false);
      adjustZoomToFit();
      await showMainWindow();
    } catch (e) {
      unlisten();
      if (isFirst) await reportAppStartupError(e);
      else await reportWindowStartError(e);
    }

    return () => {
      unlisten();
      webGLRenderer?.dispose();
      AutoSnapshotManager.getInstance().stop();
      if (import.meta.hot) {
        window.location.reload();
      }
    };
  });

  createEffect(() => {
    if (projectStore.autoSnapshotEnabled && projectStore.autoSnapshotInterval) {
      const manager = AutoSnapshotManager.getInstance();
      if (projectStore.autoSnapshotInterval === manager.getCurrentInterval()) return;
      manager.start(projectStore.autoSnapshotInterval);
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

        <AnalogSticks />

        <KeyListener />
        <ClipboardListener />
      </div>
    </Show>
  );
}
