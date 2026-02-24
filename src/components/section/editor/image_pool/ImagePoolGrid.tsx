import { ImagePoolEntry } from '@sledge-pdm/core';
import { color, showContextMenu } from '@sledge-pdm/ui';
import { Component, For } from 'solid-js';
import { selectEntry } from '~/features/image_pool';
import { buildImagePoolEntryContextMenu } from '~/features/image_pool/contextMenu';
import { useImageBlobUrl } from '~/features/image_pool/useWebpBlobUrl';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { flexCol, flexRow } from '~/styles/styles';

const Item: Component<{ entry: ImagePoolEntry }> = (props) => {
  const imageSrc = useImageBlobUrl(() => props.entry.id);

  return (
    <div
      class={flexCol}
      style={{
        width: 'fit-content',
        overflow: 'visible',
        'box-sizing': 'border-box',
        cursor: 'pointer',
        margin: '-1px',
        border: projectStore.imagePool.state.selectedEntryId === props.entry.id ? `1px solid ${color.active}` : `1px solid ${color.border}`,
        opacity: props.entry.visible ? 1 : 0.5,
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        showContextMenu(buildImagePoolEntryContextMenu(props.entry), e);
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
          src={imageSrc()}
          width={40}
          height={40}
          alt={props.entry.descriptionName}
          title={props.entry.descriptionName}
          style={{ 'object-fit': 'cover' }}
          onError={(e) => {
            e.currentTarget.style.opacity = '0.5';
            e.currentTarget.alt = 'missing';
          }}
          onClick={(e) => {
            if (projectStore.imagePool.state.selectedEntryId === props.entry.id) {
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
      <For each={projectStore.imagePool.entries}>{(entry) => <Item entry={entry} />}</For>
    </div>
  );
};

export default ImagePoolGrid;
