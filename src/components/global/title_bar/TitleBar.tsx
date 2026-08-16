import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge-pdm/core';
import { color, Icon } from '@sledge-pdm/ui';
import { useLocation } from '@solidjs/router';
import { createEffect, createMemo, onCleanup, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import SaveSection from '~/components/global/title_bar/SaveSection';
import TopMenuBar from '~/components/global/title_bar/TopMenuBar';
import { CURRENT_PROJECT_VERSION } from '~/features/io/project/Project';
import { ioStore, isProjectChanged } from '~/stores/EditorStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { flexRow } from '~/styles/styles';
import { normalizeJoin } from '~/utils/FileUtils';
import { window as platformWindow, UnlistenFn } from '~/utils/platform';
import './title_bar_region.css';

const titleBarRoot = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  position: relative;
  pointer-events: all;
  background-color: var(--color-controls);
  align-items: center;
`;

const titleBarTitleContainer = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  flex: 1;
  margin-right: auto;
  padding-left: 24px;
  align-items: center;
  overflow: hidden;
`;

const titleBarTitle = css`
  width: fit-content;
  font-family: k12x8;
  font-size: 8px;
  height: 8px;
  vertical-align: bottom;
  white-space: pre;
`;

const titleBarTitleSub = css`
  width: fit-content;
  font-family: ZFB03;
  font-size: var(--text-sm);
  white-space: pre;
  height: 8px;
  vertical-align: bottom;
  opacity: 0.5;
`;

const titleBarSize = css`
  width: fit-content;
  font-family: ZFB08;
  font-size: 8px;
  white-space: pre;
  opacity: 0.9;
`;

const titleBarProjectVersion = css`
  width: fit-content;
  font-family: ZFB08;
  font-size: 8px;
  white-space: pre;
  padding: 2px 4px;
  background-color: var(--color-surface);
  border-radius: 3px;
  opacity: 0.9;
`;

const titleDivider = css`
  height: 8px;
  width: 1px;
  background-color: var(--color-border);
  margin-left: 12px;
  margin-right: 12px;
`;

const titleBarSaveSection = css`
  display: flex;
  flex-direction: row;
  width: fit-content;
  height: 100%;
  align-items: center;
  margin: 0 12px;
`;

const titleBarControls = css`
  display: flex;
  flex-direction: row;
`;

const titleBarControlButtonContainer = css`
  display: flex;
  flex-direction: column;
  height: 32px;
  border: none;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  padding-left: 18px;
  padding-right: 18px;
  pointer-events: all;
  &:hover {
    background-color: var(--color-button-hover);
  }
`;

const titleBarControlCloseButtonContainer = css`
  &:hover {
    background-color: #ff0000b0;
  }
`;

const titleBarControlButtonImg = css`
  border: none;
  image-rendering: pixelated;
  padding: 1px;
`;

export default function TitleBar() {
  const [windowState, setWindowState] = createStore({
    maximizable: false,
    minimizable: false,
    closable: false,
    maximized: false,
    decorated: true,
    title: '',
  });

  let maximizedUnlisten: UnlistenFn | undefined;

  onMount(async () => {
    const window = platformWindow.getCurrentWindow();
    setWindowState({
      maximizable: await window.isMaximizable(),
      minimizable: await window.isMinimizable(),
      closable: await window.isClosable(),
      maximized: await window.isMaximized(),
      decorated: await window.isDecorated(),
      title: await window.title(),
    });

    maximizedUnlisten = await platformWindow.getCurrentWindow().onResized(async () => {
      setWindowState('maximized', await platformWindow.getCurrentWindow().isMaximized());
    });
  });

  onCleanup(() => {
    maximizedUnlisten?.();
  });

  // get window title according to current situation.
  const windowTitle = createMemo(() => {
    const fileName = ioStore.savedLocation.name ?? '[new project]';
    const projPath =
      ioStore.savedLocation.path && ioStore.savedLocation.name ? normalizeJoin(ioStore.savedLocation.path, ioStore.savedLocation.name) : undefined;
    // mac/linux does not have custom titlebar, so show some additional info here
    if (windowState.decorated) {
      const sizeText = `(${projectStore.canvas.size.width}x${projectStore.canvas.size.height})`;
      if (projPath) return `${fileName} - ${projPath} | ${sizeText}`;
      else return `${fileName} | ${sizeText}`;
    } else {
      const projPath = ioStore.savedLocation.path;
      if (projPath) return `${fileName} - ${projPath}`;
      else return `${fileName}`;
    }
  });

  const location = useLocation();
  createEffect(() => {
    if (location.pathname.startsWith('/editor')) {
      // NOTE: THIS DOES NOT CHANGE TITLE IN GTK WINDOW TITLEBAR
      platformWindow.getCurrentWindow().setTitle(windowTitle());
    }
  });

  const borderWindowLabels: string[] = ['settings', 'restore'];
  const shouldShowBorder = () => borderWindowLabels.find((l) => l === platformWindow.getCurrentWindow().label);
  const titleLessWindowLabels: string[] = ['about'];
  const shouldShowTitle = () => !titleLessWindowLabels.find((l) => l === platformWindow.getCurrentWindow().label);

  return (
    <header>
      <div
        style={{
          'border-bottom': shouldShowBorder() ? `1px solid ${color.border}` : 'none',
          'pointer-events': 'all',
        }}
      >
        <Show when={!windowState.decorated}>
          <nav
            class={titleBarRoot}
            data-tauri-drag-region
            style={{
              'background-color': shouldShowTitle() ? undefined : 'transparent',
            }}
          >
            <div class={titleBarTitleContainer}>
              <Show when={shouldShowTitle()}>
                <Show when={ioStore.isInInitialLoading && ioStore.loadingTargetPath}>
                  <p class={titleBarTitle}>
                    <span class={titleBarTitle} style={{ opacity: 0.5 }}>
                      {ioStore.loadingTargetPath?.path ? `${ioStore.loadingTargetPath.path}/` : ''}
                    </span>
                    {ioStore.loadingTargetPath?.name}
                  </p>
                </Show>
                <Show when={!ioStore.isInInitialLoading}>
                  <Show when={location.pathname.startsWith('/editor')} fallback={<p class={titleBarTitle}>{windowState.title}</p>}>
                    {/* title */}
                    <div class={flexRow}>
                      <p class={titleBarTitle}>
                        <span class={titleBarTitle} style={{ opacity: 0.5 }}>
                          {ioStore.savedLocation.path ? `${ioStore.savedLocation.path}/` : ''}
                        </span>
                        {ioStore.savedLocation.name ?? '[new project]'}
                      </p>
                      <Show when={ioStore.openAs === 'image'}>
                        <div style={{ 'margin-left': '8px' }}>
                          <Icon src='/assets/icons/title_bar/image.png' base={8} />
                        </div>
                      </Show>
                      <p class={titleBarTitleSub}>{isProjectChanged() ? ' (unsaved)' : ''}</p>
                    </div>
                    {/* project version (shown when older version, or DEV environment) */}
                    <Show
                      when={
                        ioStore.openAs === 'project' &&
                        (import.meta.env.DEV || (ioStore.loadProjectVersion && ioStore.loadProjectVersion?.project !== CURRENT_PROJECT_VERSION))
                      }
                    >
                      <div class={titleDivider} />
                      <p class={titleBarProjectVersion}>V{ioStore.loadProjectVersion?.project}</p>
                    </Show>
                    {/* canvas size */}
                    <div class={titleDivider} />
                    <p class={titleBarSize}>
                      {projectStore.canvas.size.width} x {projectStore.canvas.size.height}
                    </p>
                  </Show>
                </Show>
              </Show>
            </div>

            <Show when={!ioStore.isInInitialLoading && location.pathname.startsWith('/editor')}>
              <div class={titleBarSaveSection}>
                <SaveSection />
              </div>

              <div style={{ height: '18px', width: '1px', 'background-color': color.border, 'margin-left': '0px', 'margin-right': '12px' }} />
            </Show>
            <div class={titleBarControls} data-tauri-drag-region-exclude>
              <Show when={windowState.minimizable}>
                <div
                  class={titleBarControlButtonContainer}
                  onClick={async (e) => {
                    e.preventDefault();
                    await platformWindow.getCurrentWindow().minimize();
                  }}
                  data-tauri-drag-region-exclude
                >
                  <Icon
                    class={titleBarControlButtonImg}
                    src={'/assets/icons/title_bar/minimize_10.png'}
                    color={color.onBackground}
                    base={10}
                    data-tauri-drag-region-exclude
                  />
                </div>
              </Show>

              <Show when={windowState.maximizable}>
                <div
                  class={titleBarControlButtonContainer}
                  onClick={async (e) => {
                    e.preventDefault();
                    await platformWindow.getCurrentWindow().toggleMaximize();
                  }}
                  data-tauri-drag-region-exclude
                >
                  <Icon
                    class={titleBarControlButtonImg}
                    src={windowState.maximized ? '/assets/icons/title_bar/quit_maximize_10.png' : '/assets/icons/title_bar/maximize_10.png'}
                    color={color.onBackground}
                    base={10}
                    data-tauri-drag-region-exclude
                  />
                </div>
              </Show>

              <Show when={windowState.closable}>
                <div
                  class={clsx(titleBarControlButtonContainer, titleBarControlCloseButtonContainer)}
                  onClick={async (e) => {
                    e.preventDefault();
                    await platformWindow.getCurrentWindow().close();
                  }}
                  data-tauri-drag-region-exclude
                >
                  <Icon
                    class={titleBarControlButtonImg}
                    src={'/assets/icons/title_bar/close_10.png'}
                    color={color.onBackground}
                    base={10}
                    data-tauri-drag-region-exclude
                  />
                </div>
              </Show>
            </div>
          </nav>
        </Show>

        <Show when={location.pathname.startsWith('/editor')}>
          <TopMenuBar />
        </Show>
      </div>
    </header>
  );
}
