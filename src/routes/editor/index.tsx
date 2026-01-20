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
import { loadGlobalSettings } from '~/features/io/config/load';
import { loadEditorState } from '~/features/io/editor/load';
import { saveEditorStateImmediate } from '~/features/io/editor/save';
import { importableFileExtensions } from '~/features/io/FileExtensions';
import KeyListener from '~/features/io/KeyListener';
import { ProjectLoader } from '~/features/io/project/ProjectLoader';
import { logUserWarn } from '~/features/log/service';
import { AutoSnapshotManager } from '~/features/snapshot/AutoSnapshotManager';
import { handleCloseRequest } from '~/routes/editor/close';
import { getInitialLoader, InitialLoadTypes } from '~/routes/editor/load';
import { reportInitialLoadError } from '~/routes/editor/loadError';
import { appearanceStore, ioStore, setIOStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
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

  let unlisten: UnlistenFn;

  onMount(async () => {
    unlisten = await platformWindow.getCurrentWindow().onCloseRequested(handleCloseRequest);
    try {
      setIOStore('isInInitialLoading', true);
      await showMainWindow();
      await loadGlobalSettings();
      const editorState = await loadEditorState();
      // const result = await tryLoadProject(editorState);
      // TODO: EditorStateの扱い( (x)EDITOR_STATEパス )
      const { initialLoadType, loader, fatalError, targetPath } = await getInitialLoader(editorState!);
      if (!loader) {
        // ローダーが用意できなかった = フォールバック(NEW_PROJECT_FALLBACK)すらしていないので単純にloadと同様に落とす
        await reportInitialLoadError(initialLoadType, fatalError, undefined, targetPath);
      } else {
        const result = await loader.load();
        if (result.ok) {
          // TODO: 下の説明を解読する　なにこれ
          // Save editor state if load succeeded.
          // This will replace last saved project paths, so that prevent getting same error after failed to open last project.
          await saveEditorStateImmediate();
          adjustZoomToFit();
        } else {
          switch (initialLoadType) {
            case InitialLoadTypes.PATH_PROJECT:
            case InitialLoadTypes.PATH_PROJECT_LAST:
            case InitialLoadTypes.PATH_IMAGE_PROJECT:
            case InitialLoadTypes.PATH_IMAGE_PROJECT_LAST:
              const fallbackResult = await ProjectLoader.fromNew({ ...globalConfig.default.canvasSize }).load();
              if (fallbackResult.ok) {
                await saveEditorStateImmediate();
                adjustZoomToFit();
                await reportInitialLoadError(initialLoadType, result.error, undefined, targetPath);
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
      setIOStore('isInInitialLoading', false);
    } catch (e) {
      // ここいる？？
      // プロジェクト読み込みの段階はエラー吐かない想定なので、ここはCONFIG,EDITOR_STATEまでのキャッチでいいかも　要検討
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
