import { flexCol, flexRow } from '@sledge/core';
import { showContextMenu } from '@sledge/ui';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Component, createSignal, For, onCleanup, onMount } from 'solid-js';
import { getEntries, removeEntry, transferToCurrentLayer } from '~/controllers/canvas/image_pool/ImagePoolController';
import { ContextMenuItems } from '~/models/menu/ContextMenuItems';
import { eventBus } from '~/utils/EventBus';

const Item: Component<{ id: string; name: string; path: string; visible: boolean }> = (props) => {
  return (
    <div
      class={flexCol}
      style={{
        gap: '8px',
        padding: '4px 0',
        'overflow-x': 'hidden',
        width: 'fit-content',
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        showContextMenu(
          props.name,
          [
            {
              ...ContextMenuItems.BaseTransfer,
              onSelect: () => transferToCurrentLayer(props.id, false),
            },
            {
              ...ContextMenuItems.BaseTransferRemove,
              onSelect: () => transferToCurrentLayer(props.id, true),
            },
            {
              ...ContextMenuItems.BaseRemove,
              label: 'Remove from Pool',
              onSelect: () => removeEntry(props.id),
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
          src={convertFileSrc(props.path)}
          width={40}
          height={40}
          alt={props.name}
          title={props.name}
          style={{ 'object-fit': 'cover', 'border-radius': '2px', border: '1px solid #0003' }}
          onError={(e) => {
            e.currentTarget.style.opacity = '0.5';
            e.currentTarget.alt = 'missing';
          }}
        />
      </div>
    </div>
  );
};

const ImagePoolGrid: Component = () => {
  const [entries, setEntries] = createSignal(getEntries());
  const onChanged = (e: { newEntries: ReturnType<typeof getEntries> }) => setEntries(e.newEntries);

  onMount(() => eventBus.on('imagePool:entriesChanged', onChanged));
  onCleanup(() => eventBus.off('imagePool:entriesChanged', onChanged));

  return (
    <div class={flexRow} style={{ 'flex-wrap': 'wrap', gap: '6px' }}>
      <For each={entries()}>{(e) => <Item id={e.id} name={e.fileName ?? e.id} path={e.originalPath} visible={e.visible} />}</For>
    </div>
  );
};

export default ImagePoolGrid;
