import { closestCenter, DragDropProvider, DragDropSensors, SortableProvider } from '@thisbeyond/solid-dnd';
import { Component, createEffect, createSignal, For, onMount } from 'solid-js';
import { activeLayer, addLayer, allLayers, removeLayer } from '~/controllers/layer_list/LayerListController';

import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/components/globals/section_global.css';
import { layerList } from '~/styles/section/layer.css';
import { flexCol, flexRow, w100 } from '~/styles/snippets.css';
import LayerItem from './item/LayerItem';
import Slider from '../common/basics/Slider';
import { getActiveLayerIndex, setLayerProp } from '~/controllers/layer/LayerController';
import { vars } from '~/styles/global.css';
import Checkbox from '../common/basics/Checkbox';
import { BlendMode } from '~/types/Layer';
// 並べ替え用ユーティリティ関数

const LayerList: Component<{}> = () => {
  const [items, setItems] = createSignal(allLayers());
  const [activeItem, setActiveItem] = createSignal(null);
  const ids = () => items().map((l) => l.id);

  onMount(() => {
    setItems(allLayers());
  });

  createEffect(() => {
    setItems(allLayers());
  });

  const onDragStart = ({ draggable }: { draggable: any }) => setActiveItem(draggable.id);

  function moveLayer(draggedId: string, targetIndex: number) {
    const fromIndex = layerListStore.layers.findIndex((l) => l.id === draggedId);
    if (fromIndex === -1 || fromIndex === targetIndex) return;

    const updated = [...layerListStore.layers];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setLayerListStore('layers', updated);
    setItems(allLayers());
  }

  const onDragEnd = ({ draggable, droppable }: { draggable: any; droppable: any }) => {
    if (draggable && droppable) {
      const currentItems = ids();
      const fromIndex = currentItems.indexOf(draggable.id);
      const toIndex = currentItems.indexOf(droppable.id);
      if (fromIndex !== toIndex) {
        moveLayer(draggable.id, toIndex);
      }
    }
  };

  return (
    <div class={sectionRoot}>
      <div class={flexRow} style={{ 'margin-bottom': '6px' }}>
        <p class={sectionCaption} style={{ 'flex-grow': 1 }}>
          layers.
        </p>

        <div class={flexRow} style={{ gap: '4px' }}>
          <button
            onClick={async () => {
              await addLayer('dot1');
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
        <div class={flexRow} style={{ 'align-items': 'center', gap: vars.spacing.sm }}>
          <p>opacity.</p>
          <Slider
            default={activeLayer().opacity}
            min={0}
            max={1}
            allowFloat={true}
            onValueChanged={(newValue) => {
              setLayerProp(activeLayer().id, 'opacity', newValue);
            }}
          />
        </div>
        <div
          class={flexRow}
          style={{ 'align-items': 'center', gap: vars.spacing.sm, 'margin-bottom': vars.spacing.md }}
        >
          <p>multiply.</p>
          <Checkbox
            checked={activeLayer().mode === BlendMode.multiply}
            onChange={(checked) => {
              setLayerProp(activeLayer().id, 'mode', checked ? BlendMode.multiply : BlendMode.normal);
            }}
          />
        </div>

        <DragDropProvider
          onDragStart={onDragStart}
          onDragEnd={(e) => {
            onDragEnd({ draggable: e.draggable, droppable: e.droppable });
          }}
          collisionDetector={closestCenter}
        >
          <DragDropSensors>
            <div class={layerList}>
              <SortableProvider ids={ids()}>
                <For each={items()}>
                  {(layer, index) => (
                    <LayerItem layer={layer} index={index()} isLast={index() === items().length - 1} />
                  )}
                </For>
              </SortableProvider>
            </div>
            {/* <DragOverlay>
                                    <div class="sortable"><LayerItem layer={activeItemLayer()} /></div>
                                </DragOverlay> */}
          </DragDropSensors>
        </DragDropProvider>
      </div>
    </div>
  );
};

export default LayerList;
