import { onMount } from 'solid-js';
import ScrollFadeContainer from '~/components/global/common/ScrollFadeContainer';
import RecentFileList from '~/components/global/RecentFileList';
import ThemeToggle from '~/components/global/ThemeToggle';
import { loadGlobalConfig } from '~/features/io/config/load';
import { ErrorTypes } from '~/features/io/project/ProjectLoader';
import { openExistingProject, openNewProject, openProjectWithExplorer } from '~/features/io/window';
import { InitialLoadTypes } from '~/routes/editor/load';
import { reportInitialLoadError } from '~/routes/editor/loadError';
import { ioStore } from '~/stores/EditorStores';
import { openWindow, showMainWindow } from '~/utils/WindowUtils';
import {
  header as menuContainer,
  headerItem as menuItem,
  openButtonMargin,
  recentFilesCaption,
  recentFilesContainerScroll,
  rightTopArea,
  rightTopLinkButton,
  startContent,
  startHeader,
  startRoot,
} from './style';

export default function Home() {
  onMount(async () => {
    try {
      await loadGlobalConfig();
      await showMainWindow();
    } catch (e) {
      await reportInitialLoadError(InitialLoadTypes.UNKNOWN, {
        type: ErrorTypes.UNKNOWN_ERROR,
        detail: `Unknown error while start window load.\n${e}`,
        stacktrace: e instanceof Error ? e.stack : undefined,
      });
    }
  });

  return (
    <div class={startRoot}>
      <div class={startContent}>
        <p class={startHeader}>HELLO.</p>

        <div class={menuContainer}>
          <button type='button' class={menuItem} onClick={() => openNewProject()}>
            +&ensp;new.
          </button>
          <button type='button' class={`${menuItem} ${openButtonMargin}`} onClick={() => openProjectWithExplorer()}>
            &gt;&ensp;open.
          </button>
        </div>
        <p class={recentFilesCaption}>recent files.</p>

        <ScrollFadeContainer class={recentFilesContainerScroll}>
          <RecentFileList files={ioStore.recentFiles} onClick={(item) => openExistingProject(item)} />
        </ScrollFadeContainer>
      </div>
      <div class={rightTopArea}>
        <ThemeToggle noBackground={false} />
        <button type='button' class={rightTopLinkButton} onClick={() => openWindow('about')}>
          about.
        </button>
        <button type='button' class={rightTopLinkButton} onClick={() => openWindow('settings')}>
          settings.
        </button>
      </div>
    </div>
  );
}
