import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { color } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createEffect, createSignal, onMount, Show } from 'solid-js';
import SaveSection from '~/components/global/title_bar/SaveSection';
import TopMenuBar from '~/components/global/title_bar/TopMenuBar';
import { fileStore } from '~/stores/EditorStores';
import { canvasStore, projectStore } from '~/stores/ProjectStores';
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
  margin-right: auto;
  padding-left: 24px;
  align-items: center;
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

const titleInfo = css`
  display: flex;
  flex-direction: row;
`;

export default function TitleBar() {
  const [isMaximizable, setIsMaximizable] = createSignal(false);
  const [isMinimizable, setIsMinimizable] = createSignal(false);
  const [isClosable, setIsClosable] = createSignal(false);
  const [isMaximized, setMaximized] = createSignal(false);
  const [isDecorated, setIsDecorated] = createSignal(true);
  const [windowTitle, setWindowTitle] = createSignal('');

  onMount(async () => {
    const window = getCurrentWindow();
    setIsMaximizable(await window.isMaximizable());
    setIsMinimizable(await window.isMinimizable());
    setIsClosable(await window.isClosable());
    setMaximized(await window.isMaximized());
    setIsDecorated(await window.isDecorated());
    setWindowTitle(await window.title());
  });

  getCurrentWindow().onResized(async () => {
    setMaximized(await getCurrentWindow().isMaximized());
  });

  createEffect(() => {
    if (location.pathname.startsWith('/editor')) {
      let title = '';
      let fileName = fileStore.savedLocation.name ?? '[new project]';
      // non-custom titlebar (mac/linux)
      if (isDecorated()) {
        const size = `(${canvasStore.canvas.width} x ${canvasStore.canvas.height})`;
        const projPath = fileStore.savedLocation.path;
        if (projPath) {
          title += `${fileName} ${size} - ${projPath}`;
        } else {
          title += `${fileName} ${size}`;
        }
      } else {
        const projPath = fileStore.savedLocation.path;
        if (projPath) {
          title += `${fileName} - ${projPath}`;
        } else {
          title += `${fileName}`;
        }
      }

      getCurrentWindow().setTitle(title);
    }
  });

  const borderWindowLabels: string[] = ['settings', 'restore'];
  const shouldShowBorder = () => borderWindowLabels.find((l) => l === getCurrentWindow().label);
  const titleLessWindowLabels: string[] = ['about'];
  const shouldShowTitle = () => !titleLessWindowLabels.find((l) => l === getCurrentWindow().label);

  return (
    <header>
      <div
        style={{
          'border-bottom': shouldShowBorder() ? `1px solid ${color.borderSecondary}` : 'none',
          'pointer-events': 'all',
        }}
      >
        <Show when={!isDecorated()}>
          <nav
            class={titleBarRoot}
            data-tauri-drag-region
            style={
              !shouldShowTitle()
                ? {
                    'background-color': 'transparent',
                  }
                : {}
            }
          >
            <div class={titleBarTitleContainer}>
              <Show when={shouldShowTitle()}>
                <Show when={location.pathname.startsWith('/editor')} fallback={<p class={titleBarTitle}>{windowTitle()}</p>}>
                  <div
                    class={titleInfo}
                    style={{
                      height: '8px',
                    }}
                  >
                    <p class={titleBarTitle}>
                      <span class={titleBarTitle} style={{ opacity: 0.5 }}>
                        {fileStore.savedLocation.path ? `${fileStore.savedLocation.path}\\` : ''}
                      </span>
                      {fileStore.savedLocation.name ?? '[new project]'}
                    </p>
                    <Show when={fileStore.openAs === 'image'}>
                      <div style={{ 'margin-left': '8px' }}>
                        <Icon src='icons/title_bar/image.png' base={8} />
                      </div>
                    </Show>
                    <p class={titleBarTitleSub}>{projectStore.isProjectChangedAfterSave ? ' (unsaved)' : ''}</p>
                  </div>
                  <div style={{ height: '8px', width: '1px', 'background-color': color.border, 'margin-left': '12px', 'margin-right': '12px' }} />
                  <p class={titleBarSize} style={{ opacity: 0.9 }}>
                    {canvasStore.canvas.width} x {canvasStore.canvas.height}
                  </p>
                </Show>
              </Show>
            </div>

            <Show when={location.pathname.startsWith('/editor')}>
              <div class={titleBarSaveSection}>
                <SaveSection />
              </div>

              <div style={{ height: '18px', width: '1px', 'background-color': color.border, 'margin-left': '0px', 'margin-right': '12px' }} />
            </Show>
            <div class={titleBarControls} data-tauri-drag-region-exclude>
              <Show when={isMinimizable()}>
                <div
                  class={titleBarControlButtonContainer}
                  onClick={async (e) => {
                    e.preventDefault();
                    await getCurrentWindow().minimize();
                  }}
                  data-tauri-drag-region-exclude
                >
                  <Icon
                    class={titleBarControlButtonImg}
                    src={'/icons/title_bar/minimize_10.png'}
                    color={color.onBackground}
                    base={10}
                    data-tauri-drag-region-exclude
                  />
                </div>
              </Show>

              <Show when={isMaximizable()}>
                <div
                  class={titleBarControlButtonContainer}
                  onClick={async (e) => {
                    e.preventDefault();
                    await getCurrentWindow().toggleMaximize();
                  }}
                  data-tauri-drag-region-exclude
                >
                  <Icon
                    class={titleBarControlButtonImg}
                    src={isMaximized() ? '/icons/title_bar/quit_maximize_10.png' : '/icons/title_bar/maximize_10.png'}
                    color={color.onBackground}
                    base={10}
                    data-tauri-drag-region-exclude
                  />
                </div>
              </Show>

              <Show when={isClosable()}>
                <div
                  class={clsx(titleBarControlButtonContainer, titleBarControlCloseButtonContainer)}
                  onClick={async (e) => {
                    e.preventDefault();
                    await getCurrentWindow().close();
                  }}
                  data-tauri-drag-region-exclude
                >
                  <Icon
                    class={titleBarControlButtonImg}
                    src={'/icons/title_bar/close_10.png'}
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
