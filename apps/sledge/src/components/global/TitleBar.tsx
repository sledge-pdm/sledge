import { getTheme, vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createEffect, createSignal, onMount, Show } from 'solid-js';
import SaveSection from '~/components/global/SaveSection';
import TopMenuBar from '~/components/global/TopMenuBar';
import { setBottomBarText } from '~/controllers/log/LogController';
import { fileStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { projectStore } from '~/stores/ProjectStores';
import {
  titleBarControlButtonContainer,
  titleBarControlButtonImg,
  titleBarControlCloseButtonContainer,
  titleBarControls,
  titleBarRoot,
  titleBarSaveSection,
  titleBarTitle,
  titleBarTitleContainer,
} from '~/styles/globals/title_bar.css';
import '~/styles/globals/title_bar_region.css';

export default function TitleBar() {
  let titleBarNavEl: HTMLElement;

  const isEditor = () => location.pathname.startsWith('/editor');

  const [isMaximizable, setIsMaximizable] = createSignal(false);
  const [isMinimizable, setIsMinimizable] = createSignal(false);
  const [isClosable, setIsClosable] = createSignal(false);
  const [isMaximized, setMaximized] = createSignal(false);

  onMount(async () => {
    const window = getCurrentWindow();
    setIsMaximizable(await window.isMaximizable());
    setIsMinimizable(await window.isMinimizable());
    setIsClosable(await window.isClosable());
    titleBarNavEl.addEventListener('pointerdown', (e: PointerEvent) => {
      setBottomBarText(e.buttons.toString() + ' ' + e.pointerType + ' ' + Date.now());
    });
  });

  getCurrentWindow().onResized(async (handler) => {
    setMaximized(await getCurrentWindow().isMaximized());
  });

  createEffect(() => {
    if (isEditor()) {
      getCurrentWindow().setTitle(
        `${projectStore.lastSavedAt ? (fileStore.location.name ?? '< unknown project >') : '< new project >'} ${fileStore.location.path ? `(${fileStore.location.path})` : ''}`
      );
    }
  });

  const borderWindowLabels: string[] = ['settings'];
  const shouldShowBorder = () => borderWindowLabels.find((l) => l === getCurrentWindow().label);
  const titleLessWindowLabels: string[] = ['about'];
  const shouldShowTitle = () => !titleLessWindowLabels.find((l) => l === getCurrentWindow().label);

  return (
    <header class={getTheme(globalConfig.appearance.theme)}>
      <div
        style={{
          'border-bottom': shouldShowBorder() ? `1px solid ${vars.color.border}` : 'none',
        }}
      >
        <nav ref={(el) => (titleBarNavEl = el)} class={titleBarRoot} data-tauri-drag-region>
          <Show when={shouldShowTitle()}>
            <div class={titleBarTitleContainer}>
              <p class={titleBarTitle} style={{ opacity: 0.5 }}>
                {projectStore.lastSavedAt && `${fileStore.location.path}\\`}
              </p>
              <p class={titleBarTitle}>{projectStore.lastSavedAt ? (fileStore.location.name ?? '< unknown project >') : '< new project >'}</p>
            </div>
          </Show>

          <Show when={isEditor()}>
            <div class={titleBarSaveSection}>
              <SaveSection />
            </div>

            <div style={{ height: '20px', width: '1px', 'background-color': vars.color.border, 'margin-left': '2px', 'margin-right': '12px' }} />
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

        <Show when={isEditor()}>
          <TopMenuBar />
        </Show>
      </div>
    </header>
  );
}
