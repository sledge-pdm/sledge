import { getCurrentWindow } from '@tauri-apps/api/window';
import { createEffect, createSignal, onMount } from 'solid-js';
import { setBottomBarText } from '~/controllers/log/LogController';
import { projectStore } from '~/stores/ProjectStores';
import {
  titleBarControlButtonImg,
  titleBarControlCloseButton,
  titleBarControlMaximizeButton,
  titleBarControlMinimizeButton,
  titleBarControls,
  titleBarRoot,
  titleBarTitle,
} from '~/styles/components/globals/title_bar.css';
import "~/styles/title_bar_region.css";

export default function TitleBar() {
  const window = getCurrentWindow();
  let titleBarNavEl: HTMLElement;

  const [isMaximizable, setIsMaximizable] = createSignal(true);
  const [isMinimizable, setIsMinimizable] = createSignal(true);
  const [isClosable, setIsClosable] = createSignal(true);
  const [isEditor, setIsEditor] = createSignal(false);
  const [title, setTitle] = createSignal('');
  const [isMaximized, setMaximized] = createSignal(false);

  onMount(async () => {
    setIsMaximizable(await window.isMaximizable());
    setIsMinimizable(await window.isMinimizable());
    setIsClosable(await window.isClosable());
    setTitle(await window.title());
    setIsEditor(window.label.startsWith('editor'));
    titleBarNavEl.addEventListener("pointerdown", (e: PointerEvent) => {
      setBottomBarText(e.buttons.toString() + " " + e.pointerType + " " + Date.now())
    })
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

  const borderWindowLabels: string[] = ['editor'];
  const shouldShowBorder = () => borderWindowLabels.find((l) => l === window.label);

  return (
    <header
      style={{
        'pointer-events': 'all',
        'border-bottom': shouldShowBorder() ? '1px solid #aaa' : 'none',
      }}
    >
      <nav ref={(el) => (titleBarNavEl = el)} class={titleBarRoot} data-tauri-drag-region='p, button'>
        <p class={titleBarTitle}>{title()}.</p>
        <div class={titleBarControls}>
          {isMinimizable() && (
            <button class={titleBarControlMinimizeButton} onClick={() => window.minimize()}>
              <img class={titleBarControlButtonImg} src={'/icons/title_bar/minimize.png'} />
            </button>
          )}
          {isMaximizable() && (
            <button class={titleBarControlMaximizeButton} onClick={() => window.toggleMaximize()}>
              <img
                class={titleBarControlButtonImg}
                src={isMaximized() ? '/icons/title_bar/leave_maximize.png' : '/icons/title_bar/maximize.png'}
              />
            </button>
          )}
          {isClosable() && (
            <button class={titleBarControlCloseButton} onClick={() => window.close()}>
              <img class={titleBarControlButtonImg} src={'/icons/title_bar/close.png'} />
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
