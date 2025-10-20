import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { DirEntry } from '@tauri-apps/plugin-fs';
import { Component, Show } from 'solid-js';

export interface FilesConfig {
  twoColumns: boolean;
  pathEditMode: boolean;
}

const getIconForName = (name: string, isDirectory: boolean) => {
  if (isDirectory) return '/icons/files/folder.png';
  if (name.endsWith('.sledge')) return '/icons/files/file_sledge.png';
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) return '/icons/files/image.png';
  return '/icons/files/file.png';
};

const fileItemContainer = css`
  display: flex;
  flex-direction: row;
  padding-right: 8px;
  box-sizing: border-box;
  gap: 8px;
  overflow: hidden;
  align-items: center;
`;

const iconContainer = css`
  display: flex;
  flex-direction: column;
  width: 8px;
  height: 8px;
`;

const fileName = css`
  font-family: PM10;
  font-size: 10px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const openIndicator = css`
  font-family: ZFB03;
  opacity: 0.5;
  align-self: flex-end;
`;

const FileItem: Component<{
  entry: DirEntry;
  title?: string;
  isMe: boolean;
  isPartOfMe: boolean;
  config: FilesConfig;
  onClick?: (entry: DirEntry) => void;
}> = (props) => {
  const { entry, title, isMe, isPartOfMe, config, onClick } = props;

  return (
    <div
      title={title ?? entry.name}
      class={fileItemContainer}
      style={{
        width: config.twoColumns ? '50%' : '100%',
      }}
    >
      <div class={iconContainer}>
        <Icon src={getIconForName(entry.name, entry.isDirectory)} base={8} color={isMe || isPartOfMe ? color.active : undefined} />
      </div>
      <a
        onClick={() => {
          onClick?.(entry);
        }}
        class={fileName}
        style={{
          'text-decoration': entry.isDirectory ? 'underline' : 'none',
          color: isMe || isPartOfMe ? color.active : undefined,
          'pointer-events': isMe ? 'none' : 'auto',
        }}
      >
        {entry.name}
      </a>
      <Show when={isMe}>
        <p class={openIndicator}>(opened)</p>
      </Show>
    </div>
  );
};

export default FileItem;
