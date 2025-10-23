import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { DirEntry } from '@tauri-apps/plugin-fs';
import { Component, Show } from 'solid-js';
import { openableFileExtensions } from '~/features/io/FileExtensions';

const fileItemContainer = css`
  display: flex;
  flex-direction: row;
  padding: 4px 4px;
  box-sizing: border-box;
  gap: 6px;
  overflow: hidden;
  align-items: center;
  cursor: pointer;

  opacity: 0.9;

  &:hover {
    background-color: var(--color-surface);
    color: var(--color-accent);
    opacity: 1;
  }
  &:hover > p {
    color: var(--color-accent);
  }
`;

const iconContainer = css`
  display: flex;
  flex-direction: column;
  width: 8px;
  height: 8px;
`;

const fileName = css`
  font-family: ZFB08, k12x8;
  font-size: 8px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
`;

const openIndicator = css`
  font-family: ZFB03;
  opacity: 0.5;
  align-self: flex-end;
`;

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

const isOpenableFile = (name: string) => {
  return openableFileExtensions.some((ext) => name.endsWith(`.${ext}`));
};

const FileItem: Component<{
  entry: DirEntry;
  title?: string;
  isMe: boolean;
  isPartOfMe: boolean;
  config: FilesConfig;
  onClick?: (entry: DirEntry) => void;
}> = (props) => {
  const { entry, title, isMe, isPartOfMe, config, onClick } = props;

  if (entry.isFile && !isOpenableFile(entry.name)) return;

  return (
    <div
      title={title ?? entry.name}
      class={fileItemContainer}
      style={{
        width: config.twoColumns ? '50%' : '100%',
      }}
      onClick={() => {
        onClick?.(entry);
      }}
    >
      <div class={iconContainer}>
        <Icon src={getIconForName(entry.name, entry.isDirectory)} base={8} color={isMe || isPartOfMe ? color.active : undefined} />
      </div>
      <p
        class={fileName}
        style={{
          opacity: entry.isDirectory ? 0.8 : undefined,
          'text-decoration': entry.isDirectory ? 'underline' : 'none',
          color: isMe || isPartOfMe ? color.active : undefined,
          'pointer-events': isMe ? 'none' : 'auto',
        }}
      >
        {entry.name}
      </p>
      <Show when={isMe}>
        <p class={openIndicator}>(opened)</p>
      </Show>
    </div>
  );
};

export default FileItem;
