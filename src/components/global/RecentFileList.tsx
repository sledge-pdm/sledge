import { css } from '@acab/ecsstatic';
import { FileLocation } from '@sledge/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Component, createEffect, For } from 'solid-js';
import { createStore } from 'solid-js/store';
import { thumbnailDir } from '~/features/io/project/out/save';
import { getFileUniqueId, normalizeJoin } from '~/utils/FileUtils';
import ListFileItem from './ListFileItem';

export const container = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 2px;
`;
const RecentFileList: Component<{ files: FileLocation[]; onClick: (file: FileLocation) => void }> = (props) => {
  const [thumbnails, setThumbnails] = createStore<Record<string, string>>({});

  createEffect(() => {
    props.files.forEach(async (file) => {
      if (!file.path || !file.name) return;
      const path = normalizeJoin(file.path, file.name);
      const fileId = await getFileUniqueId(path);
      const fileName = fileId + '.png';
      const thumbPath = normalizeJoin(await thumbnailDir(), fileName);
      const assetUrl = convertFileSrc(thumbPath);

      setThumbnails(path, assetUrl);
    });
  });

  return (
    <div class={container}>
      <For each={props.files}>
        {(file, i) => {
          if (!file.path || !file.name) return null;
          const path = normalizeJoin(file.path, file.name);
          const thumbnail = () => thumbnails[path];
          return <ListFileItem onClick={props.onClick} thumbnail={thumbnail()} file={file} />;
        }}
      </For>
    </div>
  );
};

export default RecentFileList;
