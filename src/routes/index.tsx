import { onMount } from 'solid-js';
import RecentFileList from '~/components/common/RecentFileList';
import { addRecentFile } from '~/controllers/config/GlobalConfigController';
import { loadGlobalSettings, saveGlobalSettings } from '~/io/global_config/globalSettings';
import { importProjectFromFileSelection } from '~/io/project/project';
import { globalStore, setGlobalStore } from '~/stores/GlobalStores';
import { FileLocation } from '~/types/FileLocation';
import { getFileNameAndPath } from '~/utils/PathUtils';
import { safeInvoke } from '~/utils/TauriUtils';
import {
  closeWindowsByLabel,
  getExistingProjectSearchParams,
  getNewProjectSearchParams,
  WindowOptionsProp,
} from '~/utils/WindowUtils';
import { sideSection, sideSectionItem, welcomeHeadline, welcomeRoot } from './start.css';

export const StartWindowOptions: WindowOptionsProp = {
  title: 'sledge',
  width: 700,
  height: 500,
  acceptFirstMouse: true,
  resizable: false,
  parent: undefined,
  closable: true,
  maximizable: true,
  minimizable: true,
  decorations: false,
  fullscreen: false,
};

export default function Home() {
  onMount(() => {
    loadGlobalSettings();
    saveGlobalSettings();
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
    console.log(getNewProjectSearchParams());
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
    setGlobalStore('recentFiles', []);
  };

  return (
    <div class={welcomeRoot}>
      <p class={welcomeHeadline}>HELLO.</p>
      <div class={sideSection}>
        <a class={sideSectionItem} onClick={() => createNew()}>
          +&ensp;new.
        </a>
        <a class={sideSectionItem} style={{ 'margin-left': '2px' }} onClick={(e) => openProject()}>
          &gt;&ensp;open.
        </a>
        <a
          class={sideSectionItem}
          style={{ 'margin-left': '2px' }}
          onClick={(e) =>
            safeInvoke('open_window', {
              payload: {
                kind: 'settings',
              },
            })
          }
        >
          <img src={'/icons/misc/settings.png'} width={16} height={16} />
          &ensp;settings.
        </a>
      </div>
      <RecentFileList files={globalStore.recentFiles} onClick={(item) => openExistingProject(item)} />
    </div>
  );
}
