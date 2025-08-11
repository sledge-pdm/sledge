import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Dropdown, Slider } from '@sledge/ui';
import { Component, createEffect, createSignal, For, onCleanup, onMount } from 'solid-js';
import { setLayerProp } from '~/controllers/layer/LayerController';
import { activeLayer, addLayer, allLayers, moveLayer, removeLayer } from '~/controllers/layer/LayerListController';
import { BlendModeOptions } from '~/models/layer/Layer';
import { layerListStore } from '~/stores/ProjectStores';
import { layerList } from '~/styles/section/editor/layer.css';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/section/section_item.css';
import { listenEvent } from '~/utils/TauriUtils';
import ImagePoolItem from './item/ImagePoolItem';
import LayerItem from './item/LayerItem';

const LayerList: Component<{}> = () => {
  const [items, setItems] = createSignal(allLayers());
  const [activeItem, setActiveItem] = createSignal(null);
  const ids = () => items().map((l) => l.id);

  listenEvent('onSetup', () => {
    setItems(allLayers());
  });

  createEffect(() => {
    setItems(allLayers());
  });

  const onDragStart = ({ draggable }: { draggable: any }) => setActiveItem(draggable.id);

  function handleMove(draggedId: string, targetIndex: number) {
    const fromIndex = layerListStore.layers.findIndex((l) => l.id === draggedId);
    if (fromIndex === -1 || fromIndex === targetIndex) return;

    moveLayer(fromIndex, targetIndex);
    setItems(allLayers());
  }

  const onDragEnd = ({ draggable, droppable }: { draggable: any; droppable: any }) => {
    if (draggable && droppable) {
      const currentItems = ids();
      const fromIndex = currentItems.indexOf(draggable.id);
      const toIndex = currentItems.indexOf(droppable.id);
      if (fromIndex !== toIndex) {
        handleMove(draggable.id, toIndex);
      }
    }
  };

  const cancelDrag = (e: PointerEvent) => {
    setActiveItem(null);
  };

  onMount(() => {
    window.addEventListener('pointercancel', cancelDrag);
    window.addEventListener('pointerup', cancelDrag);
  });

  onCleanup(() => {
    window.removeEventListener('pointercancel', cancelDrag);
    window.removeEventListener('pointerup', cancelDrag);
  });

  return (
    <div class={sectionRoot}>
      <div class={flexRow} style={{ 'margin-bottom': '6px' }}>
        <p class={sectionCaption} style={{ 'flex-grow': 1 }}>
          layers.
        </p>

        <div class={flexRow} style={{ gap: '4px' }}>
          <button
            onClick={async () => {
              await addLayer({ name: 'layer1' });
              setItems(allLayers());
            }}
          >
            + add.
          </button>

          <button
            onClick={() => {
              removeLayer(activeLayer()?.id);
              setItems(allLayers());
            }}
          >
            - remove.
          </button>
        </div>
      </div>
      <div class={sectionContent}>
        <div
          class={flexRow}
          style={{
            'align-items': 'center',
            gap: vars.spacing.sm,
            'margin-bottom': vars.spacing.sm,
          }}
        >
          <div
            class={flexRow}
            style={{
              width: '120px',
              height: 'auto',
            }}
          >
            <Dropdown
              value={activeLayer().mode}
              options={BlendModeOptions}
              onChange={(e) => {
                setLayerProp(activeLayer().id, 'mode', e);
              }}
            />
          </div>
          <div class={flexRow} style={{ width: '100%', 'align-items': 'center' }}>
            <p style={{ width: '36px' }}>{Math.ceil(activeLayer().opacity * 100)}%</p>
            <Slider
              value={activeLayer().opacity}
              min={0}
              max={1}
              allowFloat={true}
              labelMode={'none'}
              onChange={(newValue) => {
                setLayerProp(activeLayer().id, 'opacity', newValue);
              }}
            />
          </div>
        </div>

        <div class={layerList}>
          <ImagePoolItem />
          <For each={items()}>
            {(layer, index) => {
              return <LayerItem layer={layer} index={index()} isLast={index() === items().length - 1} />;
            }}
          </For>
        </div>
      </div>
    </div>
  );
};

export default LayerList;
