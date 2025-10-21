import { color } from '@sledge/theme';
import { MenuListOption, showContextMenu } from '@sledge/ui';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Component, For } from 'solid-js';
import { hideEntry, ImagePoolEntry, removeEntry, selectEntry, showEntry, transferToCurrentLayer } from '~/features/image_pool';
import { imagePoolStore } from '~/stores/ProjectStores';
import { flexCol, flexRow } from '~/styles/styles';
import { ContextMenuItems } from '~/utils/ContextMenuItems';
import { pathToFileLocation } from '~/utils/FileUtils';

const Item: Component<{ entry: ImagePoolEntry }> = (props) => {
  return (
    <div
      class={flexCol}
      style={{
        width: 'fit-content',
        overflow: 'visible',
        'box-sizing': 'border-box',
        cursor: 'pointer',
        margin: '-1px',
        border: imagePoolStore.selectedEntryId === props.entry.id ? `1px solid ${color.active}` : `1px solid ${color.border}`,
        opacity: props.entry.visible ? 1 : 0.5,
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const entry = props.entry;
        if (!entry) return;
        const showHideItem: MenuListOption = props.entry.visible
          ? {
              ...ContextMenuItems.BaseImageHide,
              onSelect: () => {
                hideEntry(entry.id);
              },
            }
          : {
              ...ContextMenuItems.BaseImageShow,
              onSelect: () => {
                showEntry(entry.id);
              },
            };

        showContextMenu(
          `${pathToFileLocation(entry.imagePath)?.name}${props.entry.visible ? '' : ' (hidden)'}`,
          [
            showHideItem,
            {
              ...ContextMenuItems.BaseTransfer,
              onSelect: () => transferToCurrentLayer(entry.id, false),
            },
            {
              ...ContextMenuItems.BaseTransferRemove,
              onSelect: () => transferToCurrentLayer(entry.id, true),
            },
            {
              ...ContextMenuItems.BaseRemove,
              label: 'Remove from pool',
              onSelect: () => removeEntry(entry.id),
            },
          ],
          e
        );
      }}
    >
      <div
        class={flexRow}
        style={{
          'align-items': 'center',
          gap: '8px',
        }}
      >
        <img
          class={'ignore-image-select'}
          src={convertFileSrc(props.entry.imagePath)}
          width={40}
          height={40}
          alt={props.entry.imagePath}
          title={props.entry.imagePath}
          style={{ 'object-fit': 'cover' }}
          onError={(e) => {
            e.currentTarget.style.opacity = '0.5';
            e.currentTarget.alt = 'missing';
          }}
          onClick={(e) => {
            if (imagePoolStore.selectedEntryId === props.entry.id) {
              selectEntry(undefined);
            } else {
              selectEntry(props.entry.id);
            }
          }}
        />
      </div>
    </div>
  );
};

const ImagePoolGrid: Component = () => {
  return (
    <div class={flexRow} style={{ 'flex-wrap': 'wrap', gap: '8px' }}>
      <For each={imagePoolStore.entries}>{(entry) => <Item entry={entry} />}</For>
    </div>
  );
};

export default ImagePoolGrid;
