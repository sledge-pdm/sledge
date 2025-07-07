import { onMount } from 'solid-js';
import RecentFileList from '~/components/global/RecentFileList';
import ThemeToggle from '~/components/global/ThemeToggle';
import { createNew, openExistingProject, openProject } from '~/controllers/project/window';
import loadGlobalSettings from '~/io/config/in/load';
import { globalConfig } from '~/stores/GlobalStores';
import { getTheme } from '~/stores/Theme';
import { openWindow } from '~/utils/WindowUtils';
import { header as menuContainer, headerItem as menuItem, rightBottomArea, startHeader, startRoot } from './start.css';

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
