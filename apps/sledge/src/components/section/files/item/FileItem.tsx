import { flexCol, flexRow } from '@sledge/core';
import { PM10, vars, ZFB03 } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { DirEntry } from '@tauri-apps/plugin-fs';
import { Component, Show } from 'solid-js';

export interface FilesConfig {
  twoColumns: boolean;
  pathEditMode: boolean;
}

const getIconForName = (name: string, isDirectory: boolean) => {
  if (isDirectory) return '/icons/misc/folder.png';
  if (name.endsWith('.sledge')) return '/icons/misc/file_sledge.png';
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) return '/icons/misc/image.png';
  return '/icons/misc/file.png';
};

const FileItem: Component<{
  entry: DirEntry;
  isMe: boolean;
  isPartOfMe: boolean;
  config: FilesConfig;
  onClick?: (entry: DirEntry) => void;
}> = (props) => {
  const { entry, isMe, isPartOfMe, config, onClick } = props;

  return (
    <div
      title={entry.name}
      class={flexRow}
      style={{
        width: config.twoColumns ? '50%' : '100%',
        'padding-right': '8px',
        'box-sizing': 'border-box',
        gap: '8px',
        overflow: 'hidden',
        'align-items': 'center',
      }}
    >
      <div class={flexCol} style={{ width: '8px', height: '8px' }}>
        <Icon src={getIconForName(entry.name, entry.isDirectory)} base={8} color={isMe || isPartOfMe ? vars.color.active : undefined} />
      </div>
      <a
        onClick={() => {
          onClick?.(entry);
        }}
        style={{
          'font-family': `${PM10}`,
          'font-size': '10px',
          'white-space': 'nowrap',
          'text-overflow': 'ellipsis',
          overflow: 'hidden',
          //   'font-weight': entry.name.endsWith('.sledge') ? 'bold' : 'normal',
          'text-decoration': entry.isDirectory ? 'underline' : 'none',
          color: isMe ? vars.color.active : undefined,
          'pointer-events': isMe ? 'none' : 'auto',
        }}
      >
        {entry.name}
      </a>
      <Show when={isMe}>
        <p style={{ 'font-family': ZFB03, opacity: 0.5 }}>(open)</p>
      </Show>
    </div>
  );
};

export default FileItem;
