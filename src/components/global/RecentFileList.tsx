import { FileLocation, flexRow, w100 } from '@sledge/core';
import { createScrollPosition } from '@solid-primitives/scroll';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Component, createEffect, createSignal, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { thumbnailDir } from '~/io/project/out/save';
import { recentFilesCaption, recentFilesContainerCol, recentFilesContainerScroll } from '~/routes/start.css';
import { fadeBottom, fadeTop } from '~/styles/components/scroll_fade.css';
import { sectionRoot } from '~/styles/globals/section_global.css';
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

  let scrollRef: HTMLDivElement | undefined;
  const scroll = createScrollPosition(() => scrollRef);

  const [canScrollTop, setCanScrollTop] = createSignal(false);
  const [canScrollBottom, setCanScrollBottom] = createSignal(false);

  createEffect(() => {
    scroll.y;
    if (scrollRef) {
      setCanScrollTop(scrollRef.scrollTop > 0);
      setCanScrollBottom(scrollRef.scrollTop + scrollRef.clientHeight < scrollRef.scrollHeight);
    }
  });

  return (
    <Show when={props.files.length > 0}>
      <div
        class={sectionRoot}
        style={{
          'overflow-y': 'hidden',
        }}
      >
        <div class={[flexRow, w100].join(' ')}>
          <p class={recentFilesCaption}>recent files.</p>
          {/* <p class={clear} onClick={() => clearRecentFiles()}>
          clear
        </p> */}
        </div>

        <div class={recentFilesContainerScroll} style={{ 'margin-bottom': '24px' }}>
          <div ref={(el) => (scrollRef = el)} class={recentFilesContainerCol}>
            <For each={props.files}>
              {(file, i) => {
                const path = file.path + '\\' + file.name;
                const thumbnail = () => thumbnails[path];
                return <ListFileItem onClick={props.onClick} thumbnail={thumbnail()} file={file} />;
              }}
            </For>
          </div>

          <Show when={canScrollTop()}>
            <div class={fadeTop} />
          </Show>

          <Show when={canScrollBottom()}>
            <div class={fadeBottom} />
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default RecentFileList;
