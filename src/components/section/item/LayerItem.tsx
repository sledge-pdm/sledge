import { createSortable, useDragDropContext } from '@thisbeyond/solid-dnd';
import { Component } from 'solid-js';
import LayerPreview from '../../common/LayerPreview';
import Light from '~/components/common/Light';
import { getNextMagnification } from '~/models/factories/getNextMagnification';
import { layerStore, setLayerStore } from '~/stores/project/layerStore';
import {
  activeLight,
  dotMagnifContainer,
  dotMagnifText,
  layerItem,
  layerItemDisabled,
  layerItemName,
  layerItemType,
} from '~/styles/section/layer.css';
import { w100 } from '~/styles/snippets.css';
import { Layer, LayerType } from '~/types/Layer';

interface LayerItemProps {
  index: number;
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
    setLayerStore('activeLayerId', props.layer.id);
  };

  const onPreviewClicked = () => {
    if (props.index !== -1) {
      setLayerStore('layers', props.index, 'enabled', (v: boolean) => !v);
    }
  };

  const onMagnifClicked = () => {
    const next = getNextMagnification(props.layer.dotMagnification);
    if (props.index !== -1) {
      setLayerStore('layers', props.index, 'dotMagnification', next);
    }
  };

  const isActive = () => layerStore.activeLayerId === props.layer.id;

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
      <p class={layerItemType}>{props.layer.typeDescription}</p>
      <p>{props.index}.</p>
      <div style={{ display: 'flex', 'align-items': 'center' }}>
        {/* <DSLButton /> */}
        <div
          class={[layerItem, !props.layer.enabled && layerItemDisabled]
            .filter(Boolean)
            .join(' ')}
          onClick={onDetClicked}
        >
          <LayerPreview
            layer={props.layer}
            onClick={onPreviewClicked}
            maxHeight={30}
            maxWidth={30}
          />
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
