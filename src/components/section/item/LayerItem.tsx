import { createSortable, useDragDropContext } from '@thisbeyond/solid-dnd';
import { Component } from 'solid-js';
import Light from '~/components/common/Light';
import { getNextMagnification } from '~/controllers/layer/LayerController';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import {
  activeLight,
  dotMagnifContainer,
  dotMagnifText,
  layerItem,
  layerItemDisabled,
  layerItemIndex,
  layerItemName,
  layerItemType,
} from '~/styles/section/layer.css';
import { flexRow, w100 } from '~/styles/snippets.css';
import { Layer, LayerType } from '~/types/Layer';
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

  const onDetClicked = () => {
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
        // style={{ 'border-bottom': props.isLast ? 'none' : '1px solid #333' }}
        onClick={onDetClicked}
      >
        <LayerPreview layer={props.layer} onClick={onPreviewClicked} maxHeight={36} maxWidth={36} />

        <div
          class={[flexRow, w100].join(' ')}
          style={{
            'align-items': 'center',
            position: 'relative',
          }}
        >
          <div
            class={flexRow}
            style={{
              top: '2px',
              right: 0,
              left: 0,
              'margin-left': '6px',
              position: 'absolute',
            }}
          >
            <p class={layerItemIndex}>{props.index}.</p>
            <p class={layerItemType}>
              {Math.ceil(props.layer.opacity * 100)}%, {props.layer.mode}
            </p>
          </div>

          <p class={layerItemName}> {props.layer.name}</p>
          <div
            class={dotMagnifContainer}
            onClick={(e) => {
              e.stopPropagation();
              onMagnifClicked();
            }}
            onMouseOver={(e) => e.stopPropagation()}
          >
            <p class={dotMagnifText}>x{props.layer.dotMagnification}</p>
          </div>
          <Light class={activeLight} on={isActive()} />
        </div>
      </div>
    </div>
  );
};

export default LayerItem;
