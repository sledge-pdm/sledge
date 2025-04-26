import { For, onMount } from 'solid-js';
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
import EdgeInfo from '~/components/EdgeInfo';
import { loadGlobalSettings } from '~/io/global/globalIO';
import { importProjectJsonFromFileSelection } from '~/io/project/project';
import { addRecent, globalStore, setGlobalStore } from '~/stores/global/globalStore';
import { pageRoot, sideArea } from '~/styles/global.css';
import { sectionRoot } from '~/styles/section_global.css';
import { flexCol, flexRow, w100 } from '~/styles/snippets.css';
import { FileLocation } from '~/types/FileLocation';
import { getFileNameAndPath } from '~/utils/pathUtils';
import { openEditorWindow, openSingletonWindow } from '~/utils/windowUtils';

export default function Home() {
  onMount(() => {
    loadGlobalSettings();
  });

  const moveToEditor = async (selectedFile: FileLocation) => {
    openEditorWindow(selectedFile);
  };

  const createNew = () => {
    openEditorWindow();
  };

  const openProject = () => {
    importProjectJsonFromFileSelection().then((file: string | undefined) => {
      if (file !== undefined) {
        const loc = getFileNameAndPath(file);
        if (loc !== undefined) addRecent(loc);
        openEditorWindow(loc);
      }
    });
  };

  const clearRecentFiles = () => {
    setGlobalStore('recentOpenedFiles', []);
  };

  return (
    <div class={pageRoot}>
      <div class={sideArea}>
        <EdgeInfo />
      </div>

      <div class={welcomeRoot}>
        <div class={flexCol}>
          <p class={welcomeHeadline}>HELLO.</p>
          <div class={sideSection}>
            <a class={sideSectionItem} onClick={() => createNew()}>
              +&ensp;new.
            </a>
            <a
              class={sideSectionItem}
              style={{ 'margin-left': '2px' }}
              onClick={(e) => openProject()}
            >
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
              <For each={globalStore.recentOpenedFiles}>
                {(item, i) => {
                  console.log(item);
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
    </div>
  );
}
