import { For, onMount } from 'solid-js';
import { addRecentFile } from '~/controllers/config/GlobalConfigController';
import { loadGlobalSettings } from '~/io/global_config/globalSettings';
import { importProjectJsonFromFileSelection } from '~/io/project/project';
import { globalStore, setGlobalStore } from '~/stores/GlobalStores';
import { sectionRoot } from '~/styles/section_global.css';
import { flexCol, flexRow, w100 } from '~/styles/snippets.css';
import { FileLocation } from '~/types/FileLocation';
import { getFileNameAndPath } from '~/utils/PathUtils';
import { closeWindowsByLabel, openEditorWindow, openSingletonWindow, WindowOptionsProp } from '~/utils/windowUtils';
import { SettingsWindowOptions } from './settings';
import {
  recentFilesCaption,
  recentFilesContainer,
  recentFilesItem,
  recentFilesName,
  recentFilesPath,
  sideSection,
  sideSectionItem,
  welcomeHeadline,
  welcomeRoot,
} from './start.css';

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
  });

  const moveToEditor = (selectedFile: FileLocation) => {
    openEditorWindow(selectedFile);
    closeWindowsByLabel('start');
  };

  const createNew = () => {
    openEditorWindow();
    closeWindowsByLabel('start');
  };

  const openProject = () => {
    importProjectJsonFromFileSelection().then((file: string | undefined) => {
      if (file !== undefined) {
        const loc = getFileNameAndPath(file);
        addRecentFile(loc);
        openEditorWindow(loc);
        closeWindowsByLabel('start');
      }
    });
  };

  const clearRecentFiles = () => {
    setGlobalStore('recentFiles', []);
  };

  return (
    <div class={welcomeRoot}>
      <div class={flexCol}>
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
            onClick={(e) => openSingletonWindow('settings', SettingsWindowOptions)}
          >
            <img src={'/settings.png'} width={16} height={16} />
            &ensp;settings.
          </a>
        </div>

        <div class={sectionRoot}>
          <div class={[flexRow, w100].join(' ')}>
            <p class={recentFilesCaption}>recent files.</p>
            {/* <p class={clear} onClick={() => clearRecentFiles()}>
                clear
              </p> */}
          </div>
          <div class={recentFilesContainer} style={{ 'margin-bottom': '24px' }}>
            <For each={globalStore.recentFiles}>
              {(item, i) => {
                return (
                  <div class={recentFilesItem}>
                    <p>■</p>
                    <a class={recentFilesName} onClick={(e) => moveToEditor(item)}>
                      {item.name}
                    </a>
                    <p class={recentFilesPath}>{item.path}</p>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
}
