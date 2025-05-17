import { convertFileSrc } from '@tauri-apps/api/core';
import { Component, createEffect, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import genFileId from '~/io/project/genFileId';
import { thumbnailDir } from '~/io/project/saveThumbnail';
import { recentFilesCaption, recentFilesContainerCol } from '~/routes/start.css';
import { sectionRoot } from '~/styles/components/globals/section_global.css';
import { flexRow, w100 } from '~/styles/snippets.css';
import { FileLocation } from '~/types/FileLocation';
import ListFileItem from './file_item/ListFileItem';

const RecentFileList: Component<{ files: FileLocation[]; onClick: (file: FileLocation) => void }> = (props) => {
  const [thumbnails, setThumbnails] = createStore<Record<string, string>>({});

  createEffect(() => {
    props.files.forEach(async (file) => {
      // const json = await importProjectJsonFromPath(file.path + '/' + file.name);
      const path = file.path + '\\' + file.name;
      const fileId = await genFileId(path);
      const thumbPath = (await thumbnailDir()) + fileId + '.png';
      const assetUrl = convertFileSrc(thumbPath);

      setThumbnails(path, assetUrl);
    });
  });

  return (
    <Show when={props.files.length > 0}>
      <div class={sectionRoot}>
        <div class={[flexRow, w100].join(' ')}>
          <p class={recentFilesCaption}>recent files.</p>
          {/* <p class={clear} onClick={() => clearRecentFiles()}>
          clear
        </p> */}
        </div>
        <div class={recentFilesContainerCol} style={{ 'margin-bottom': '24px' }}>
          <For each={props.files}>
            {(file, i) => {
              const path = file.path + '\\' + file.name;
              const thumbnail = () => thumbnails[path];
              return <ListFileItem onClick={props.onClick} thumbnail={thumbnail()} file={file} />;
            }}
          </For>
        </div>
      </div>
    </Show>
  );
};

export default RecentFileList;
