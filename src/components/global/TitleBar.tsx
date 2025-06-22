import { getCurrentWindow } from '@tauri-apps/api/window';
import { createEffect, createSignal, onMount, Show } from 'solid-js';
import { setBottomBarText } from '~/controllers/log/LogController';
import { projectStore } from '~/stores/ProjectStores';
import { vars } from '~/styles/global.css';
import {
  titleBarControlButtonContainer,
  titleBarControlButtonImg,
  titleBarControlCloseButtonContainer,
  titleBarControls,
  titleBarRoot,
  titleBarTitle,
} from '~/styles/globals/title_bar.css';
import '~/styles/globals/title_bar_region.css';
import Icon from '../common/Icon';

export default function TitleBar() {
  let titleBarNavEl: HTMLElement;

  const [isMaximizable, setIsMaximizable] = createSignal(false);
  const [isMinimizable, setIsMinimizable] = createSignal(false);
  const [isClosable, setIsClosable] = createSignal(false);
  const [isEditor, setIsEditor] = createSignal(false);
  const [title, setTitle] = createSignal('');
  const [isMaximized, setMaximized] = createSignal(false);

  onMount(async () => {
    const window = getCurrentWindow();
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

  getCurrentWindow().onResized(async (handler) => {
    setMaximized(await getCurrentWindow().isMaximized());
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

  const borderWindowLabels: string[] = ['settings'];
  const shouldShowBorder = () => borderWindowLabels.find((l) => l === getCurrentWindow().label);
  const titleLessWindowLabels: string[] = [];
  const shouldShowTitle = () => !titleLessWindowLabels.find((l) => l === getCurrentWindow().label);

  return (
    <header
      style={{
        'pointer-events': 'all',
        'border-bottom': shouldShowBorder() ? `1px solid ${vars.color.border}` : 'none',
      }}
    >
      <nav ref={(el) => (titleBarNavEl = el)} class={titleBarRoot} data-tauri-drag-region>
        <p class={titleBarTitle}>
          {shouldShowTitle() ? `${title()}.` : ''} {getCurrentWindow().label}
        </p>

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
                src={'/icons/title_bar/minimize_2.png'}
                color={vars.color.onBackground}
                base={12}
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
                src={isMaximized() ? '/icons/title_bar/quit_maximize_2.png' : '/icons/title_bar/maximize_2.png'}
                color={vars.color.onBackground}
                base={12}
                data-tauri-drag-region-exclude
              />
            </div>
          </Show>

          <Show when={isClosable()}>
            <div
              class={titleBarControlCloseButtonContainer}
              onClick={async (e) => {
                e.preventDefault();
                await getCurrentWindow().close();
              }}
              data-tauri-drag-region-exclude
            >
              <Icon
                class={titleBarControlButtonImg}
                src={'/icons/title_bar/close_2.png'}
                color={vars.color.onBackground}
                base={12}
                data-tauri-drag-region-exclude
              />
            </div>
          </Show>
        </div>
      </nav>
    </header>
  );
}
