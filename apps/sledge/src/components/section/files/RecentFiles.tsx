import { css } from '@acab/ecsstatic';
import { Component, For, Show } from 'solid-js';
import FileItem from '~/components/section/files/item/FileItem';
import { openExistingProject } from '~/features/io/window';
import { globalConfig } from '~/stores/GlobalStores';
import { normalizeJoin } from '~/utils/FileUtils';

const recentFilesContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
  margin-left: 4px;
  margin-bottom: 8px;
`;

const noFilesText = css`
  color: var(--color-muted);
`;

const RecentFiles: Component = () => {
  return (
    <div class={recentFilesContainer}>
      <Show when={globalConfig.misc.recentFiles.length > 0} fallback={<p class={noFilesText}>[ no files ]</p>}>
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
                title={path}
                isMe={false}
                isPartOfMe={false}
                onClick={() => {
                  if (!location.path || !location.name) return;

                  const ext = ['sledge', 'png', 'jpg', 'jpeg'];
                  if (ext.some((e) => location.name?.endsWith(`.${e}`))) {
                    openExistingProject(location);
                  } else {
                    // TODO: show error toast
                  }
                }}
              />
            );
          }}
        </For>
      </Show>
    </div>
  );
};

export default RecentFiles;
