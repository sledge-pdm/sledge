import { flexCol, flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { MenuListOption, showContextMenu } from '@sledge/ui';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Component, createSignal, For, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { getEntries, getEntry, hideEntry, removeEntry, showEntry, transferToCurrentLayer } from '~/controllers/canvas/image_pool/ImagePoolController';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { ContextMenuItems } from '~/models/menu/ContextMenuItems';
import { imagePoolStore, setImagePoolStore } from '~/stores/ProjectStores';
import { eventBus, Events } from '~/utils/EventBus';

const Item: Component<{ entry: ImagePoolEntry }> = (props) => {
  const [stateStore, setStateStore] = createStore({
    visible: props.entry.visible,
  });

  const onChanged = (e: Events['imagePool:entryPropChanged']) => {
    if (e.id === props.entry.id) {
      const newEntry = getEntry(props.entry.id);
      setStateStore('visible', newEntry?.visible ?? true);
    }
  };

  onMount(() => {
    eventBus.on('imagePool:entryPropChanged', onChanged);
    return () => {
      eventBus.off('imagePool:entryPropChanged', onChanged);
    };
  });

  return (
    <div
      class={flexCol}
      style={{
        width: 'fit-content',
        overflow: 'visible',
        'box-sizing': 'border-box',
        cursor: 'pointer',
        margin: '-1px',
        border: imagePoolStore.selectedEntryId === props.entry.id ? `1px solid ${vars.color.active}` : `1px solid ${vars.color.border}`,
        opacity: stateStore.visible ? 1 : 0.5,
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const entry = props.entry;
        if (!entry) return;
        const showHideItem: MenuListOption = stateStore.visible
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
          `${entry.fileName}${stateStore.visible ? '' : ' (hidden)'}`,
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
          src={convertFileSrc(props.entry.originalPath)}
          width={40}
          height={40}
          alt={props.entry.fileName}
          title={props.entry.fileName}
          style={{ 'object-fit': 'cover' }}
          onError={(e) => {
            e.currentTarget.style.opacity = '0.5';
            e.currentTarget.alt = 'missing';
          }}
          onClick={(e) => {
            setImagePoolStore('selectedEntryId', props.entry.id);
          }}
        />
      </div>
    </div>
  );
};

const ImagePoolGrid: Component = () => {
  const [entries, setEntries] = createSignal(getEntries());
  const onChanged = () => setEntries(getEntries());

  onMount(() => {
    eventBus.on('imagePool:entriesChanged', onChanged);
    return () => {
      eventBus.off('imagePool:entriesChanged', onChanged);
    };
  });

  return (
    <div class={flexRow} style={{ 'flex-wrap': 'wrap', gap: '8px' }}>
      <For each={entries()}>{(entry) => <Item entry={entry} />}</For>
    </div>
  );
};

export default ImagePoolGrid;
