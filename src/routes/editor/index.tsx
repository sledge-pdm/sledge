import { css } from '@acab/ecsstatic';
import { color } from '@sledge-pdm/ui';
import { createEffect, createSignal, onMount, Show } from 'solid-js';
import CanvasArea from '~/components/canvas/CanvasArea';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import BottomBar from '~/components/global/BottomBar';
import Loading from '~/components/global/Loading';
import OnscreenControl from '~/components/global/onscreen_control/OnscreenControl';
import SideSectionControls from '~/components/section/SideSectionControls';
import { adjustZoomToFit } from '~/features/canvas';
import { addImagesFromFiles, addImagesFromLocal } from '~/features/image_pool';
import ClipboardListener from '~/features/io/clipboard/ClipboardListener';
import { loadGlobalSettings } from '~/features/io/config/load';
import { loadEditorState } from '~/features/io/editor/load';
import { saveEditorStateImmediate } from '~/features/io/editor/save';
import { importableFileExtensions } from '~/features/io/FileExtensions';
import KeyListener from '~/features/io/KeyListener';
import { logUserWarn } from '~/features/log/service';
import { AutoSnapshotManager } from '~/features/snapshot/AutoSnapshotManager';
import { handleCloseRequest } from '~/routes/editor/close';
import { tryLoadProject } from '~/routes/editor/load';
import { appearanceStore } from '~/stores/EditorStores';
import { projectStoreFormer } from '~/stores/ProjectStores';
import { flexCol, pageRoot } from '~/styles/styles';
import { window as platformWindow, UnlistenFn } from '~/utils/platform';
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
    unlisten = await platformWindow.getCurrentWindow().onCloseRequested(handleCloseRequest);
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
    if (projectStoreFormer.autoSnapshotEnabled && projectStoreFormer.autoSnapshotInterval) {
      const manager = AutoSnapshotManager.getInstance();
      if (projectStoreFormer.autoSnapshotInterval === manager.getCurrentInterval()) return;
      manager.start(projectStoreFormer.autoSnapshotInterval);
    }
  });

  // listen('tauri://drag-drop', async (e: any) => {
  //   const paths = e.payload.paths as string[];
  //   addImagesFromLocal(paths.filter((p) => importableFileExtensions.some((ext) => p.endsWith(`.${ext}`))));

  //   paths
  //     .filter((p) => p.endsWith('.sledge'))
  //     .forEach((p) => {
  //       const loc = pathToFileLocation(p);
  //       if (loc) openExistingProject(loc);
  //     });
  // });

  const isFileDrag = (event: DragEvent) => {
    const types = event.dataTransfer?.types;
    if (!types) return false;
    return Array.from(types).includes('Files');
  };

  const handleFileDrop = async (event: DragEvent) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();

    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length === 0) return;

    const imageFiles = files.filter((file) => importableFileExtensions.some((ext) => file.name.toLowerCase().endsWith(`.${ext}`)));
    const projectFiles = files.filter((file) => file.name.toLowerCase().endsWith('.sledge'));
    if (projectFiles.length > 0) {
      logUserWarn('Drag&drop-ing sledge files is not supported. Open from explorer instead.', { label: 'ProjectImport' });
    }

    const filesWithPath = imageFiles.filter((file) => Boolean((file as { path?: string }).path));
    if (filesWithPath.length > 0) {
      addImagesFromLocal(filesWithPath.map((file) => (file as { path?: string }).path!).filter(Boolean));
    }

    const filesWithoutPath = imageFiles.filter((file) => !(file as { path?: string }).path);
    if (filesWithoutPath.length > 0) {
      await addImagesFromFiles(filesWithoutPath);
    }
  };

  return (
    <Show when={!isLoading()} fallback={<Loading />}>
      <div
        class={pageRoot}
        onDragOver={(e) => {
          if (isFileDrag(e)) e.preventDefault();
        }}
        onDrop={handleFileDrop}
      >
        <div class={mainContainer}>
          <div class={mainContent}>
            <SideSectionControls side='leftSide' />

            <div class={flexCol} style={{ 'flex-grow': 1, position: 'relative' }}>
              <div style={{ 'flex-grow': 1, 'background-color': color.canvasArea }}>
                <CanvasArea />
              </div>
            </div>

            <SideSectionControls side='rightSide' />
          </div>

          <BottomBar />
        </div>

        <Show when={appearanceStore.onscreenControl}>
          <OnscreenControl />
        </Show>

        <KeyListener />
        <ClipboardListener />
      </div>
    </Show>
  );
}
