import { color } from '@sledge/theme';
import { trackStore } from '@solid-primitives/deep';
import { useSearchParams } from '@solidjs/router';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { CloseRequestedEvent, getCurrentWindow } from '@tauri-apps/api/window';
import { confirm } from '@tauri-apps/plugin-dialog';
import { createEffect, createSignal, onMount, Show } from 'solid-js';
import CanvasArea from '~/components/canvas/CanvasArea';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import AnalogSticks from '~/components/global/analog_sticks/AnalogSticks';
import ClipboardListener from '~/components/global/ClipboardListener';
import KeyListener from '~/components/global/KeyListener';
import Loading from '~/components/global/Loading';
import SideSectionControl from '~/components/section/SideSectionControl';
import { saveLastProject } from '~/features/backup';
import { adjustZoomToFit } from '~/features/canvas';
import { addToImagePool } from '~/features/image_pool';
import { loadGlobalSettings } from '~/features/io/config/load';
import { loadEditorState } from '~/features/io/editor/load';
import { saveEditorState } from '~/features/io/editor/save';
import { importableFileExtensions } from '~/features/io/FileExtensions';
import { openExistingProject } from '~/features/io/window';
import { AutoSnapshotManager } from '~/features/snapshot/AutoSnapshotManager';
import { tryLoadProject } from '~/routes/editor/load';
import { fileStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore, layerListStore, projectStore, setProjectStore } from '~/stores/ProjectStores';
import { flexCol, pageRoot } from '~/styles/styles';
import { pathToFileLocation } from '~/utils/FileUtils';
import { reportAppStartupError, reportWindowStartError, showMainWindow } from '~/utils/WindowUtils';

export default function Editor() {
  const [sp, setSp] = useSearchParams();
  const isFirstStartup = sp.startup === 'true';

  createEffect(() => {
    trackStore(canvasStore.canvas);
    trackStore(layerListStore);
    setProjectStore('isProjectChangedAfterSave', true);
  });

  const [isLoading, setIsLoading] = createSignal(true);

  let unlisten: UnlistenFn;
  const handleCloseRequest = async (event: CloseRequestedEvent) => {
    await saveEditorState();
    const isSavedProject = fileStore.savedLocation.name && fileStore.savedLocation.path;
    if (globalConfig.default.open === 'last' && !(globalConfig.default.addOnlySavedProjectToLastOpened && !isSavedProject)) {
      const loc = await saveLastProject();

      if (loc === undefined) {
        const confirmed = await confirm('Failed to save unsaved state. Quit sledge anyway?\n(unsaved changes will be discarded.)', {
          kind: 'error',
          okLabel: 'Discard and quit',
          cancelLabel: 'Cancel',
        });
        if (!confirmed) {
          event.preventDefault();
          return;
        }
      }
    } else {
      if (!isLoading() && projectStore.isProjectChangedAfterSave) {
        const confirmed = await confirm('There are unsaved changes.\nSure to quit without save?', {
          kind: 'warning',
          title: 'Unsaved Changes',
          okLabel: 'Quit without save.',
          cancelLabel: 'Cancel.',
        });
        if (!confirmed) {
          event.preventDefault();
          return;
        }
      }
    }
  };

  onMount(async () => {
    unlisten = await getCurrentWindow().onCloseRequested(handleCloseRequest);
    try {
      await loadGlobalSettings();
      await loadEditorState();
      await tryLoadProject();
      setIsLoading(false);
      adjustZoomToFit();
      await showMainWindow();
    } catch (e) {
      unlisten();
      if (isFirstStartup) await reportAppStartupError(e);
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
        {/* <Companion /> */}
      </div>
    </Show>
  );
}
