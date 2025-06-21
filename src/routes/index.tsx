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

export default function Home() {
  onMount(async () => {
    await loadGlobalSettings();
  });

  const openExistingProject = (selectedFile: FileLocation) => {
    console.log(selectedFile);
    openWindow('editor', { query: getExistingProjectSearchParams(selectedFile) }).then(() => {
      // closeWindowsByLabel('start');
    });
  };

  const createNew = () => {
    openWindow('editor', { query: getNewProjectSearchParams() }).then(() => {
      // closeWindowsByLabel('start');
    });
  };

  const openProject = () => {
    openNewFile().then((file: string | undefined) => {
      console.log(file);
      if (file !== undefined) {
        const loc = getFileNameAndPath(file);
        if (!loc) return;
        addRecentFile(loc);
        openExistingProject(loc);
      }
    });
  };

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
