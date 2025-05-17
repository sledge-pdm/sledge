import { getCurrentWindow } from '@tauri-apps/api/window';
import { createEffect, createSignal, onMount, Show } from 'solid-js';
import { setBottomBarText } from '~/controllers/log/LogController';
import { projectStore } from '~/stores/ProjectStores';
import {
  titleBarControlButtonCloseImg,
  titleBarControlButtonMaximizeImg,
  titleBarControlButtonMinimizeImg,
  titleBarControlCloseButton,
  titleBarControlMaximizeButton,
  titleBarControlMinimizeButton,
  titleBarControls,
  titleBarRoot,
  titleBarTitle,
} from '~/styles/components/globals/title_bar.css';

import '~/styles/tile_bar_region.css';

export default function TitleBar() {
  const window = getCurrentWindow();
  let titleBarNavEl: HTMLElement;

  const [isMaximizable, setIsMaximizable] = createSignal(false);
  const [isMinimizable, setIsMinimizable] = createSignal(false);
  const [isClosable, setIsClosable] = createSignal(false);
  const [isEditor, setIsEditor] = createSignal(false);
  const [title, setTitle] = createSignal('');
  const [isMaximized, setMaximized] = createSignal(false);

  onMount(async () => {
    setIsMaximizable(await window.isMaximizable());
    setIsMinimizable(await window.isMinimizable());
    setIsClosable(await window.isClosable());
    setTitle(await window.title());
    setIsEditor(window.label.startsWith('editor'));
    titleBarNavEl.addEventListener('pointerdown', (e: PointerEvent) => {
      setBottomBarText(e.buttons.toString() + ' ' + e.pointerType + ' ' + Date.now());
    });
    // if (isEditor()) {
    //   setTitle(`${projectStore.name} - ${projectStore.path}`);
    // }
  });

  window.onResized(async (handler) => {
    setMaximized(await window.isMaximized());
  });

  createEffect(() => {
    if (isEditor()) {
      let pathText = '';
      let isSavedText = '';
      if (projectStore.path !== undefined && projectStore.path !== '') {
        pathText += projectStore.isProjectChangedAfterSave ? '(unsaved)' : '';
        pathText += ' - ' + projectStore.path;
      } else {
        pathText += '(not saved yet)';
      }

      setTitle(`${projectStore.name} ${pathText} `);
    }
  });

  const borderWindowLabels: string[] = ['editor', 'settings'];
  const shouldShowBorder = () => borderWindowLabels.find((l) => l === window.label);

  return (
    <header
      style={{
        'pointer-events': 'all',
        'border-bottom': shouldShowBorder() ? '1px solid #aaa' : 'none',
      }}
    >
      <nav ref={(el) => (titleBarNavEl = el)} class={titleBarRoot} data-tauri-drag-region>
        <p class={titleBarTitle} data-tauri-drag-region-exclude>
          {title()}.
        </p>
        <div class={titleBarControls} data-tauri-drag-region-exclude>
          <Show when={isMinimizable()}>
            <button
              class={titleBarControlMinimizeButton}
              onClick={async (e) => {
                e.preventDefault();
                await window.minimize();
              }}
              data-tauri-drag-region-exclude
            >
              <img class={titleBarControlButtonMinimizeImg} src={'/icons/title_bar/minimize_2.png'} data-tauri-drag-region-exclude />
            </button>
          </Show>

          <Show when={isMaximizable()}>
            <button
              class={titleBarControlMaximizeButton}
              onClick={async (e) => {
                e.preventDefault();
                await window.toggleMaximize();
              }}
              data-tauri-drag-region-exclude
            >
              <img
                class={titleBarControlButtonMaximizeImg}
                src={isMaximized() ? '/icons/title_bar/quit_maximize_2.png' : '/icons/title_bar/maximize_2.png'}
                data-tauri-drag-region-exclude
              />
            </button>
          </Show>

          <Show when={isClosable()}>
            <button
              class={titleBarControlCloseButton}
              onClick={async (e) => {
                e.preventDefault();
                await window.close();
              }}
              data-tauri-drag-region-exclude
            >
              <img class={titleBarControlButtonCloseImg} src={'/icons/title_bar/close_2.png'} data-tauri-drag-region-exclude />
            </button>
          </Show>
        </div>
      </nav>
    </header>
  );
}
