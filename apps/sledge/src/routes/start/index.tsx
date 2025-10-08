import { onMount } from 'solid-js';
import RecentFileList from '~/components/global/RecentFileList';
import ScrollFadeContainer from '~/components/global/ScrollFadeContainer';
import ThemeToggle from '~/components/global/ThemeToggle';
import { loadGlobalSettings } from '~/io/config/load';
import { createNew, openExistingProject, openProject } from '~/io/window';
import { globalConfig } from '~/stores/GlobalStores';
import { openWindow, reportWindowStartError, showMainWindow } from '~/utils/WindowUtils';
import {
  header as menuContainer,
  headerItem as menuItem,
  openButtonMargin,
  recentFilesCaption,
  recentFilesContainerScroll,
  rightTopArea,
  startContent,
  startHeader,
  startRoot,
} from './style';

export default function Home() {
  onMount(async () => {
    try {
      await loadGlobalSettings();
      await showMainWindow();
    } catch (e) {
      await reportWindowStartError(e);
    }
  });

  return (
    <div class={startRoot}>
      <div class={startContent}>
        <p class={startHeader}>HELLO.</p>

        <div class={menuContainer}>
          <a class={menuItem} onClick={() => createNew()}>
            +&ensp;new.
          </a>
          <a class={`${menuItem} ${openButtonMargin}`} onClick={(e) => openProject()}>
            &gt;&ensp;open.
          </a>
        </div>
        <p class={recentFilesCaption}>recent files.</p>

        <ScrollFadeContainer class={recentFilesContainerScroll}>
          <RecentFileList files={globalConfig.misc.recentFiles} onClick={(item) => openExistingProject(item)} />
        </ScrollFadeContainer>
      </div>
      <div class={rightTopArea}>
        <ThemeToggle noBackground={false} />
        <a onClick={() => openWindow('about')}>about.</a>
        <a onClick={() => openWindow('settings')}>settings.</a>
      </div>
    </div>
  );
}
