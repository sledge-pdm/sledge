import { css } from '@acab/ecsstatic';
import { FileLocation } from '@sledge/core';
import { color } from '@sledge/theme';
import { Icon, MenuListOption, showContextMenu } from '@sledge/ui';
import { DirEntry } from '@tauri-apps/plugin-fs';
import { Component, createMemo, Show } from 'solid-js';
import { createEntryFromLocalImage, insertEntry, selectEntry } from '~/features/image_pool';
import { openExistingProject } from '~/features/io/window';
import { isImportableFile, isOpenableFile, normalizeJoin } from '~/utils/FileUtils';
import { revealInFileBrowser } from '~/utils/NativeOpener';

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
  showOnlySledgeOpenable: boolean;
  twoColumns: boolean;
  pathEditMode: boolean;
}

const getIconForName = (name: string, isDirectory: boolean) => {
  if (isDirectory) return '/icons/files/folder.png';
  if (name.endsWith('.sledge')) return '/icons/files/file_sledge.png';
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) return '/icons/files/image.png';
  return '/icons/files/file.png';
};

const FileItem: Component<{
  entry: DirEntry;
  location: FileLocation;
  title?: string;
  isMe: boolean;
  isPartOfMe: boolean;
  config: FilesConfig;
  // do show context menu after called if false returned
  onClick?: (entry: DirEntry) => boolean;
}> = (props) => {
  const { entry, location, title, isMe, isPartOfMe, config, onClick } = props;

  const contextMenuOptions = createMemo<MenuListOption[]>(() => {
    const opts: MenuListOption[] = [
      { type: 'label', label: entry.name },
      {
        type: 'item',
        icon: '/icons/files/folder.png',
        label: 'show in explorer',
        onSelect: async () => {
          if (!location.path || !location.name) return;
          await revealInFileBrowser(normalizeJoin(location.path, location.name));
        },
      },
    ];

    if (entry.isDirectory) {
      // no option
    }
    if (entry.isFile) {
      if (isImportableFile(entry.name))
        opts.push({
          type: 'item',
          label: 'import to project',
          icon: '/icons/files/image.png',
          onSelect: async () => {
            if (!location.path || !location.name) return;
            const entry = await createEntryFromLocalImage(normalizeJoin(location.path, location.name));
            insertEntry(entry);
            selectEntry(entry.id);
          },
        });

      if (isOpenableFile(entry.name))
        opts.push({
          type: 'item',
          icon: '/icons/files/file_sledge.png',
          label: 'open in new window',
          onSelect: async () => {
            await openExistingProject(location);
          },
        });
    }

    return opts;
  });

  return (
    <div
      title={title ?? entry.name}
      class={fileItemContainer}
      style={{
        width: config.twoColumns ? '50%' : '100%',
        'pointer-events': isMe ? 'none' : 'auto',
      }}
      onClick={(e) => {
        const consumed = onClick?.(entry);
        if (!consumed) {
          showContextMenu(contextMenuOptions(), e);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        showContextMenu(contextMenuOptions(), e);
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
