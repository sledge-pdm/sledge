import { createSortable, useDragDropContext } from '@thisbeyond/solid-dnd';
import { Component } from 'solid-js';
import Light from '~/components/common/Light';
import { Layer, LayerType } from '~/models/canvas/layer/Layer';
import { LayerMenu } from '~/models/menu/LayerMenu';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { activeLight, layerItem, layerItemDisabled, layerItemIndex, layerItemName, layerItemType } from '~/styles/section/layer.css';
import { flexCol, flexRow, w100 } from '~/styles/snippets.css';
import { getNextMagnification } from '~/utils/LayerUtils';
import LayerPreview from '../../common/LayerPreview';

interface LayerItemProps {
  index: number;
  isLast?: boolean;
  layer: Layer;
  draggingId?: string | null;
}

const LayerItem: Component<LayerItemProps> = (props) => {
  const sortable = createSortable(props.layer.id);
  const context = useDragDropContext();
  const state = context?.[0];

  let detClass: 'dot' | 'image' | 'automate' | undefined;
  switch (props.layer.type) {
    case LayerType.Dot:
      detClass = 'dot';
      break;
    case LayerType.Image:
      detClass = 'image';
      break;
    case LayerType.Automate:
      detClass = 'automate';
      break;
  }

  const onDetClicked = (e: MouseEvent) => {
    setLayerListStore('activeLayerId', props.layer.id);
  };

  const onPreviewClicked = () => {
    if (props.index !== -1) {
      setLayerListStore('layers', props.index, 'enabled', (v: boolean) => !v);
    }
  };

  const onMagnifClicked = () => {
    const next = getNextMagnification(props.layer.dotMagnification);
    if (props.index !== -1) {
      setLayerListStore('layers', props.index, 'dotMagnification', next);
    }
  };

  const isActive = () => layerListStore.activeLayerId === props.layer.id;

  return (
    <div
      class={w100}
      classList={{
        'opacity-50': sortable.isActiveDraggable,
        'transition-transform': state && !!state.active.draggable,
      }}
      style={{ opacity: props.draggingId === props.layer.id ? 0.4 : 1 }}
      ref={sortable}
    >
      {/* <DSLButton /> */}
      <div
        class={[layerItem, !props.layer.enabled && layerItemDisabled].filter(Boolean).join(' ')}
        onClick={onDetClicked}
        onContextMenu={async (e) => {
          e.preventDefault();
          const menu = await LayerMenu.create(props.layer.id);
          menu.show();
        }}
      >
        <LayerPreview layer={props.layer} onClick={onPreviewClicked} maxHeight={36} maxWidth={36} />
        <div
          class={`${flexCol} ${w100}`}
          style={{
            'margin-left': '6px',
            'justify-content': 'center',
            gap: '1px',
          }}
        >
          <div class={flexRow}>
            <p class={layerItemIndex}>{props.index}.</p>
            <p class={layerItemType}>
              {Math.ceil(props.layer.opacity * 100)}%, {props.layer.mode}
            </p>
          </div>

          <p class={layerItemName}> {props.layer.name}</p>
          {/* <div
            class={dotMagnifContainer}
            onClick={(e) => {
              e.stopPropagation();
              onMagnifClicked();
            }}
            onMouseOver={(e) => e.stopPropagation()}
          >
            <p class={dotMagnifText}>x{props.layer.dotMagnification}</p>
          </div> */}
        </div>
        <Light class={activeLight} on={isActive()} />
      </div>
    </div>
  );
};

export default LayerItem;
