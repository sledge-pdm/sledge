import { fonts } from '@sledge/theme';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Component, createSignal, For, onCleanup, onMount } from 'solid-js';
import { getEntries, removeEntry } from '~/features/image_pool';
import { flexCol, flexRow } from '~/styles/StyleSnippets';
import { eventBus } from '~/utils/EventBus';

const Item: Component<{ id: string; name: string; path: string; visible: boolean }> = (props) => {
  return (
    <div
      class={flexCol}
      style={{
        gap: '8px',
        padding: '4px 0',
        'overflow-x': 'hidden',
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
          style={{ 'object-fit': 'cover', 'border-radius': '2px', border: '1px solid #0003' }}
          onError={(e) => {
            e.currentTarget.style.opacity = '0.5';
            e.currentTarget.alt = 'missing';
          }}
        />
        <div style={{ overflow: 'hidden' }}>
          <div style={{ 'font-family': fonts.ZFB09, 'font-size': '8px', 'text-overflow': 'ellipsis', overflow: 'hidden', 'white-space': 'nowrap' }}>
            {props.name}
          </div>
          <div style={{ 'font-size': '8px', color: '#888', 'text-overflow': 'ellipsis', overflow: 'hidden', 'white-space': 'nowrap' }}>
            {props.path}
          </div>
          <div class={flexRow} style={{ gap: '6px', 'margin-top': '6px', 'margin-bottom': '6px' }}>
            {/* <a
              style={{ 'font-family': ZFB09 }}
              title={props.visible ? 'hide' : 'show'}
              onClick={() => updateEntryPartial(props.id, { visible: !props.visible })}
            >
              {props.visible ? 'hide' : 'show'}
            </a>
            <a
              style={{ 'font-family': ZFB09 }}
              title='relink'
              onClick={async () => {
                const np = await openImageImportDialog();
                if (np && typeof np === 'string') relinkEntry(props.id, np);
                if (Array.isArray(np) && np.length > 0) relinkEntry(props.id, np[0]);
              }}
            >
              relink
            </a> */}
            <a style={{ 'font-family': fonts.ZFB09 }} title='remove' onClick={() => removeEntry(props.id)}>
              remove
            </a>
          </div>
        </div>
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
