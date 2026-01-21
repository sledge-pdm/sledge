import { css } from '@acab/ecsstatic';
import { color } from '@sledge-pdm/ui';
import { createEffect, onMount, Show } from 'solid-js';
import CanvasArea from '~/components/canvas/CanvasArea';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import BottomBar from '~/components/global/BottomBar';
import Loading from '~/components/global/Loading';
import OnscreenControl from '~/components/global/onscreen_control/OnscreenControl';
import SideSectionControls from '~/components/section/SideSectionControls';
import { adjustZoomToFit } from '~/features/canvas';
import { addImagesFromFiles, addImagesFromLocal } from '~/features/image_pool';
import ClipboardListener from '~/features/io/clipboard/ClipboardListener';
import { loadGlobalConfig } from '~/features/io/config/load';
import { loadEditorState } from '~/features/io/editor/load';
import { saveEditorStateImmediate } from '~/features/io/editor/save';
import { importableFileExtensions } from '~/features/io/FileExtensions';
import KeyListener from '~/features/io/KeyListener';
import { ErrorTypes, ProjectLoader } from '~/features/io/project/ProjectLoader';
import { logUserWarn } from '~/features/log/service';
import { AutoSnapshotManager } from '~/features/snapshot/AutoSnapshotManager';
import { handleCloseRequest } from '~/routes/editor/close';
import { getInitialLoader, InitialLoadTypes } from '~/routes/editor/load';
import { reportInitialLoadError } from '~/routes/editor/loadError';
import { appearanceStore, EditorStateStore, ioStore, setIOStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { flexCol, pageRoot } from '~/styles/styles';
import { window as platformWindow, UnlistenFn } from '~/utils/platform';
import { isFirstStartup, showMainWindow } from '~/utils/WindowUtils';

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

  let unlisten: UnlistenFn;

  // throwable
  const loadConfigs = async (): Promise<EditorStateStore> => {
    const { error: configError } = await loadGlobalConfig();
    const { store: editorStateStore, error: editorStateError } = await loadEditorState();

    // report error to be reported
    // TODO: Config系はエラー複雑めなのでおそらくerror.detailsを用いる。フォールバックがあった＋それを通知したい場合はloadXXXのerrorにそれを含めておくこと
    if (configError?.type === ErrorTypes.UNKNOWN_ERROR || configError?.type === ErrorTypes.FAILED_LOAD_RUNTIME) {
      await reportInitialLoadError(InitialLoadTypes.GLOBAL_CONFIG, configError, undefined);
    }
    if (editorStateError?.type === ErrorTypes.UNKNOWN_ERROR || editorStateError?.type === ErrorTypes.FAILED_LOAD_RUNTIME) {
      await reportInitialLoadError(InitialLoadTypes.EDITOR_STATE, configError, undefined);
    }

    return editorStateStore;
  };

  // Not throwable / return if loading itself was OK or not
  const loadProject = async (editorState: EditorStateStore): Promise<boolean> => {
    const { initialLoadType, loader, fatalError, targetPath } = await getInitialLoader(editorState);
    if (!loader) {
      await reportInitialLoadError(initialLoadType, fatalError, undefined, targetPath);
    } else {
      const result = await loader.load();
      if (result.ok) {
        return true;
      } else {
        switch (initialLoadType) {
          case InitialLoadTypes.PATH_PROJECT_LAST:
          case InitialLoadTypes.PATH_IMAGE_PROJECT_LAST:
            // Remove lastPath(ioStore.savedLocation) from editorState when failed to load last project.
            setIOStore('savedLocation', { path: undefined, name: undefined });
            await saveEditorStateImmediate();
          case InitialLoadTypes.PATH_PROJECT:
          case InitialLoadTypes.PATH_IMAGE_PROJECT:
            const fallbackResult = await ProjectLoader.fromNew({ ...globalConfig.default.canvasSize }).load();
            if (fallbackResult.ok) {
              await reportInitialLoadError(initialLoadType, result.error, undefined, targetPath);
              return true;
            } else {
              await reportInitialLoadError(InitialLoadTypes.NEW_PROJECT_FALLBACK, result.error, initialLoadType, targetPath);
            }
            break;
          default:
            await reportInitialLoadError(initialLoadType, result.error, undefined, targetPath);
            break;
        }
      }
    }

    return false;
  };

  onMount(async () => {
    unlisten = await platformWindow.getCurrentWindow().onCloseRequested(handleCloseRequest);
    setIOStore('isInInitialLoading', true);
    await showMainWindow();

    let editorState: EditorStateStore;
    try {
      editorState = await loadConfigs();
    } catch (e) {
      unlisten();
      await reportInitialLoadError(InitialLoadTypes.UNKNOWN, {
        type: ErrorTypes.UNKNOWN_ERROR,
        detail: `Unknown error while initial config load.\n${e}`,
        stacktrace: e instanceof Error ? e.stack : undefined,
      });
      return;
    }
    try {
      const isOK = await loadProject(editorState);
      if (isOK) {
        adjustZoomToFit();
      }
    } catch (e) {
      unlisten();
      await reportInitialLoadError(InitialLoadTypes.UNKNOWN, {
        type: ErrorTypes.UNKNOWN_ERROR,
        detail: `Unknown error while initial project load.\n${e}`,
        stacktrace: e instanceof Error ? e.stack : undefined,
      });
      return;
    } finally {
      setIOStore('isInInitialLoading', false);
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
    if (projectStore.project.autoSnapshotEnabled && projectStore.project.autoSnapshotInterval) {
      const manager = AutoSnapshotManager.getInstance();
      if (projectStore.project.autoSnapshotInterval === manager.getCurrentInterval()) return;
      manager.start(projectStore.project.autoSnapshotInterval);
    }
  });

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
    <Show when={ioStore ? !ioStore.isInInitialLoading : false} fallback={<Loading />}>
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
