import { FileLocation } from '@sledge/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Component, createEffect, For } from 'solid-js';
import { createStore } from 'solid-js/store';
import { thumbnailDir } from '~/io/project/out/save';
import { recentFilesContainerCol } from '~/routes/start.css';
import getFileId from '~/utils/getFileId';
import ListFileItem from './file_item/ListFileItem';

const RecentFileList: Component<{ files: FileLocation[]; onClick: (file: FileLocation) => void }> = (props) => {
  const [thumbnails, setThumbnails] = createStore<Record<string, string>>({});

  createEffect(() => {
    props.files.forEach(async (file) => {
      // const json = await importProjectJsonFromPath(file.path + '/' + file.name);
      const path = file.path + '\\' + file.name;
      const fileId = await getFileId(path);
      const thumbPath = (await thumbnailDir()) + fileId + '.png';
      const assetUrl = convertFileSrc(thumbPath);

      setThumbnails(path, assetUrl);
    });
  });

  return (
    <div class={recentFilesContainerCol}>
      <For each={props.files}>
        {(file, i) => {
          const path = file.path + '\\' + file.name;
          const thumbnail = () => thumbnails[path];
          return <ListFileItem onClick={props.onClick} thumbnail={thumbnail()} file={file} />;
        }}
      </For>
    </div>
  );
};

export default RecentFileList;
