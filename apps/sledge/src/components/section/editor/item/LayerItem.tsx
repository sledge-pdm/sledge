import { flexCol, flexRow, w100 } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Icon, Light } from '@sledge/ui';
import { LogicalPosition } from '@tauri-apps/api/dpi';
import { createSortable, transformStyle, useDragDropContext } from '@thisbeyond/solid-dnd';
import { Component } from 'solid-js';
import { Layer } from '~/models/layer/Layer';
import { LayerMenu } from '~/models/menu/LayerMenu';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import {
  activeLight,
  layerItem,
  layerItemDisabled,
  layerItemHandle,
  layerItemIndex,
  layerItemName,
  layerItemType,
} from '~/styles/section/editor/layer.css';
import { eventBus } from '~/utils/EventBus';
import LayerPreview from '../../../global/LayerPreview';

interface LayerItemProps {
  index: number;
  isLast?: boolean;
  layer: Layer;
  draggingId?: string | null;
}

const LayerItem: Component<LayerItemProps> = (props) => {
  let nameParagraphRef: HTMLParagraphElement | undefined;

  const sortable = createSortable(props.layer.id);
  const context = useDragDropContext();
  const state = context?.[0];

  const onDetClicked = (e: MouseEvent) => {
    setLayerListStore('activeLayerId', props.layer.id);
    eventBus.emit('webgl:requestUpdate', { onlyDirty: false }); //一応
  };

  const onPreviewClicked = () => {
    if (props.index !== -1) {
      setLayerListStore('layers', props.index, 'enabled', (v: boolean) => !v);
    }
    eventBus.emit('webgl:requestUpdate', { onlyDirty: false });
  };
  const isActive = () => layerListStore.activeLayerId === props.layer.id;

  return (
    <div
      class={w100}
      classList={{
        'opacity-50': sortable.isActiveDraggable,
        'transition-transform': state && !!state.active.draggable,
      }}
      style={{ opacity: props.draggingId === props.layer.id ? 0.4 : 1, ...transformStyle(sortable.transform) }}
      ref={sortable.ref}
    >
      <div
        class={[layerItem, !props.layer.enabled && layerItemDisabled].filter(Boolean).join(' ')}
        onClick={onDetClicked}
        onContextMenu={async (e) => {
          e.preventDefault();
          const menu = await LayerMenu.create(props.layer.id);
          menu.show(new LogicalPosition(e.clientX, e.clientY));
        }}
      >
        <div class={`${layerItemHandle} handle`} {...sortable.dragActivators}>
          <Icon src='/icons/misc/handle.png' base={8} color={vars.color.background} />
        </div>
        <LayerPreview layer={props.layer} onClick={onPreviewClicked} maxHeight={36} maxWidth={36} />
        <div
          class={`${flexCol} ${w100}`}
          style={{
            'padding-left': '6px',
            'justify-content': 'center',
            gap: '1px',
            'border-left': `1px solid ${vars.color.border}`,
          }}
        >
          <div class={flexRow}>
            <p class={layerItemIndex}>{props.index}.</p>
            <p class={layerItemType}>
              {Math.ceil(props.layer.opacity * 100)}%, {props.layer.mode}
            </p>
          </div>

          <p
            ref={(ref) => {
              nameParagraphRef = ref;
            }}
            class={layerItemName}
          >
            {props.layer.name}
          </p>
        </div>
        <Light class={activeLight} on={isActive()} />
      </div>
    </div>
  );
};

export default LayerItem;
