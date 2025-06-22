import { onMount } from 'solid-js';
import ThemeToggle from '~/components/common/ThemeToggle';
import RecentFileList from '~/components/global/RecentFileList';
import { addRecentFile } from '~/controllers/config/RecentFileController';
import loadGlobalSettings from '~/io/config/in/load';
import { openNewFile } from '~/io/open/open';
import { FileLocation } from '~/models/types/FileLocation';
import { globalConfig } from '~/stores/GlobalStores';
import { getTheme } from '~/stores/Theme';
import { getFileNameAndPath } from '~/utils/PathUtils';
import { getExistingProjectSearchParams, getNewProjectSearchParams, openWindow } from '~/utils/WindowUtils';
import { header as menuContainer, headerItem as menuItem, rightBottomArea, startHeader, startRoot } from './start.css';
import { createNew, openExistingProject, openProject } from '~/controllers/project/window';

export default function Home() {
  onMount(async () => {
    await loadGlobalSettings();
  });

  return (
    <div class={getTheme()}>
      <div class={startRoot}>
        <p class={startHeader}>HELLO.</p>
        <div class={menuContainer}>
          <a class={menuItem} onClick={() => createNew()}>
            +&ensp;new.
          </a>
          <a class={menuItem} style={{ 'margin-left': '2px' }} onClick={(e) => openProject()}>
            &gt;&ensp;open.
          </a>
        </div>

        <RecentFileList files={globalConfig.misc.recentFiles} onClick={(item) => openExistingProject(item)} />

        <div class={rightBottomArea}>
          <a onClick={() => openWindow('about')}>about.</a>
          <a onClick={() => openWindow('settings')}>settings.</a>
          <ThemeToggle noBackground={false} />
        </div>
      </div>
    </div>
  );
}
