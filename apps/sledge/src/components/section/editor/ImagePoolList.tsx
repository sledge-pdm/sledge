import { convertFileSrc } from '@tauri-apps/api/core';
import { Component, For, createSignal, onCleanup, onMount } from 'solid-js';
import { openImageImportDialog } from '~/controllers/canvas/image_pool/ImageImport';
import { getEntries, relinkEntry, removeEntry, updateEntryPartial } from '~/controllers/canvas/image_pool/ImagePoolController';
import { eventBus } from '~/utils/EventBus';

const Item: Component<{ id: string; name: string; path: string; visible: boolean }> = (props) => {
  return (
    <div
      style={{
        display: 'grid',
        'grid-template-columns': '40px 1fr auto',
        gap: '8px',
        'align-items': 'center',
        padding: '4px 0',
      }}
    >
      <img
        src={convertFileSrc(props.path)}
        width={40}
        height={40}
        style={{ 'object-fit': 'cover', 'border-radius': '2px', border: '1px solid #0003' }}
        onError={(e) => {
          e.currentTarget.style.opacity = '0.5';
          e.currentTarget.alt = 'missing';
        }}
      />
      <div style={{ overflow: 'hidden' }}>
        <div style={{ 'font-size': '12px', 'text-overflow': 'ellipsis', overflow: 'hidden', 'white-space': 'nowrap' }}>{props.name}</div>
        <div style={{ 'font-size': '10px', color: '#888', 'text-overflow': 'ellipsis', overflow: 'hidden', 'white-space': 'nowrap' }}>
          {props.path}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button title={props.visible ? 'hide' : 'show'} onClick={() => updateEntryPartial(props.id, { visible: !props.visible })}>
          {props.visible ? 'hide' : 'show'}
        </button>
        <button
          title='relink'
          onClick={async () => {
            const np = await openImageImportDialog();
            if (np && typeof np === 'string') relinkEntry(props.id, np);
            if (Array.isArray(np) && np.length > 0) relinkEntry(props.id, np[0]);
          }}
        >
          relink
        </button>
        <button title='remove' onClick={() => removeEntry(props.id)}>
          remove
        </button>
      </div>
    </div>
  );
};

const ImagePoolList: Component = () => {
  const [entries, setEntries] = createSignal(getEntries());
  const onChanged = (e: { newEntries: ReturnType<typeof getEntries> }) => setEntries(e.newEntries);

  onMount(() => eventBus.on('imagePool:entriesChanged', onChanged));
  onCleanup(() => eventBus.off('imagePool:entriesChanged', onChanged));

  return (
    <div style={{ display: 'grid', gap: '6px' }}>
      <For each={entries()}>
        {(e) => <Item id={e.id} name={e.originalPath.split(/[\\/]/).pop() ?? e.id} path={e.originalPath} visible={e.visible} />}
      </For>
    </div>
  );
};

export default ImagePoolList;
