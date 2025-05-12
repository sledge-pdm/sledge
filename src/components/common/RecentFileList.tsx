import { Component, createEffect, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { getProjectJsonFromPath } from '~/io/project/project';
import { recentFilesCaption, recentFilesContainer, recentFilesItem, recentFilesName, recentFilesPath, recentFilesThumb } from '~/routes/start.css';
import { sectionRoot } from '~/styles/components/globals/section_global.css';
import { flexRow, w100 } from '~/styles/snippets.css';
import { FileLocation } from '~/types/FileLocation';
import { Consts } from '~/utils/consts';

const RecentFileList: Component<{ files: FileLocation[]; onClick: (file: FileLocation) => void }> = (props) => {
  const [thumbnails, setThumbnails] = createStore<Record<string, string>>({});

  createEffect(() => {
    props.files.forEach(async (file) => {
      const json = await getProjectJsonFromPath(file.path + '/' + file.name);
      if (json.thumbnail) {
        setThumbnails(file.path + '/' + file.name, json.thumbnail);
      } else {
        setThumbnails(file.path + '/' + file.name, 'failed');
      }
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
        <div class={recentFilesContainer} style={{ 'margin-bottom': '24px' }}>
          <For each={props.files}>
            {(item, i) => {
              const thumbnail = () => thumbnails[item.path + '/' + item.name];
              return (
                <div class={recentFilesItem}>
                  <div class={recentFilesThumb}>
                    <Show when={thumbnail()} fallback={<p>loading...</p>}>
                      <Show when={thumbnail() !== 'failed'} fallback={<p>NO IMAGE</p>}>
                        <img
                          src={thumbnail()}
                          width={Consts.projectThumbnailSize}
                          height={Consts.projectThumbnailSize}
                          style={{ 'image-rendering': 'pixelated' }}
                        />
                      </Show>
                    </Show>
                  </div>
                  <div class={flexRow}>
                    <a
                      class={recentFilesName}
                      onClick={(e) => {
                        if (props.onClick) props.onClick(item);
                      }}
                    >
                      {item.name.substring(0, item.name.lastIndexOf('.'))}
                    </a>
                  </div>
                  <p class={recentFilesPath}>{item.path}</p>
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </Show>
  );
};

export default RecentFileList;
