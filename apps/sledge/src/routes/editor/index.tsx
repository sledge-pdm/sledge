import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createEffect, createSignal, onMount, Show } from 'solid-js';
import CanvasArea from '~/components/canvas/CanvasArea';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import AnalogSticks from '~/components/global/analog_sticks/AnalogSticks';
import BottomBar from '~/components/global/BottomBar';
import Loading from '~/components/global/Loading';
import SideSectionControl from '~/components/section/SideSectionControl';
import { adjustZoomToFit } from '~/features/canvas';
import { addImagesFromLocal } from '~/features/image_pool';
import ClipboardListener from '~/features/io/clipboard/ClipboardListener';
import { loadGlobalSettings } from '~/features/io/config/load';
import { loadEditorState } from '~/features/io/editor/load';
import { saveEditorStateImmediate } from '~/features/io/editor/save';
import { importableFileExtensions } from '~/features/io/FileExtensions';
import KeyListener from '~/features/io/KeyListener';
import { openExistingProject } from '~/features/io/window';
import { AutoSnapshotManager } from '~/features/snapshot/AutoSnapshotManager';
import { handleCloseRequest } from '~/routes/editor/close';
import { tryLoadProject } from '~/routes/editor/load';
import { appearanceStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/ProjectStores';
import { flexCol, pageRoot } from '~/styles/styles';
import { pathToFileLocation } from '~/utils/FileUtils';
import { isFirstStartup, reportAppStartupError, reportWindowStartError, showMainWindow } from '~/utils/WindowUtils';

const mainContainer = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;
const mainContent = css`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  height: 100%;
  width: 100%;
`;

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
      // Save editor state if load succeeded.
      // This will replace last saved project paths, so that prevent getting same error after failed to open last project.
      await saveEditorStateImmediate();
      setIsLoading(false);
      // Adjusting zoom before showing window seems to be not working on some OS except windows
      adjustZoomToFit();

      await showMainWindow();

      // So make sure it's properly zoomed on init
      adjustZoomToFit();
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
    addImagesFromLocal(paths.filter((p) => importableFileExtensions.some((ext) => p.endsWith(`.${ext}`))));

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
        <div class={mainContainer}>
          <div class={mainContent}>
            <SideSectionControl side='leftSide' />

            <div class={flexCol} style={{ 'flex-grow': 1, position: 'relative' }}>
              <div style={{ 'flex-grow': 1, 'background-color': color.canvasArea }}>
                <CanvasArea />
              </div>
            </div>

            <SideSectionControl side='rightSide' />
          </div>

          <BottomBar />
        </div>

        <Show when={appearanceStore.onscreenControl}>
          <AnalogSticks />
        </Show>

        <KeyListener />
        <ClipboardListener />
      </div>
    </Show>
  );
}
