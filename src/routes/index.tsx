import { onMount } from 'solid-js';
import RecentFileList from '~/components/global/RecentFileList';
import { addRecentFile } from '~/controllers/config/GlobalConfigController';
import { loadGlobalSettings } from '~/io/global_config/globalSettings';
import { importProjectFromFileSelection } from '~/io/project/importProject';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';
import { FileLocation } from '~/types/FileLocation';
import { getFileNameAndPath } from '~/utils/PathUtils';
import { safeInvoke } from '~/utils/TauriUtils';
import { closeWindowsByLabel, getExistingProjectSearchParams, getNewProjectSearchParams } from '~/utils/WindowUtils';
import { header as menuContainer, headerItem as menuItem, rightBottomArea, startHeader, startRoot } from './start.css';

export default function Home() {
  onMount(async () => {
    await loadGlobalSettings();
  });

  const openExistingProject = (selectedFile: FileLocation) => {
    safeInvoke('open_window', {
      payload: {
        kind: 'editor',
        query: getExistingProjectSearchParams(selectedFile),
      },
    }).then(() => {
      closeWindowsByLabel('start');
    });
  };

  const createNew = () => {
    safeInvoke('open_window', {
      payload: {
        kind: 'editor',
        query: getNewProjectSearchParams(),
      },
    }).then(() => {
      closeWindowsByLabel('start');
    });
  };

  const openProject = () => {
    importProjectFromFileSelection().then((file: string | undefined) => {
      if (file !== undefined) {
        const loc = getFileNameAndPath(file);
        if (!loc) return;
        addRecentFile(loc);
        openExistingProject(loc);
      }
    });
  };

  const clearRecentFiles = () => {
    setGlobalConfig('misc', 'recentFiles', []);
  };

  return (
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
        <a
          onClick={() => {
            safeInvoke('open_window', {
              payload: {
                kind: 'about',
              },
            });
          }}
        >
          about.
        </a>
        <a
          onClick={() => {
            safeInvoke('open_window', {
              payload: {
                kind: 'settings',
              },
            });
          }}
        >
          settings.
        </a>
      </div>
    </div>
  );
}
