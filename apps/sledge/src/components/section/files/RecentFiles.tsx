import { flexCol } from '@sledge/core';
import { Component, For } from 'solid-js';
import FileItem from '~/components/section/files/item/FileItem';
import { globalConfig } from '~/stores/GlobalStores';
import { normalizeJoin } from '~/utils/FileUtils';

const RecentFiles: Component = () => {
  return (
    <div
      class={flexCol}
      style={{
        width: '100%',
        gap: '4px',
        'margin-left': '4px',
        'margin-bottom': '8px',
      }}
    >
      <For each={globalConfig.misc.recentFiles}>
        {(location) => {
          if (!location.path || !location.name) return;
          const path = normalizeJoin(location.path, location.name);

          return (
            <FileItem
              config={{ pathEditMode: false, twoColumns: false }}
              entry={{
                isDirectory: false,
                isFile: true,
                isSymlink: false,
                name: location.name,
              }}
              isMe={false}
              isPartOfMe={false}
              onClick={() => {}}
            />
          );
        }}
      </For>
    </div>
  );
};

export default RecentFiles;
