import styles from "@styles/components/section/layer.module.css";
import {
  closestCenter,
  DragDropProvider,
  DragDropSensors,
  SortableProvider,
} from "@thisbeyond/solid-dnd";
import { Component, createSignal, For } from "solid-js";
import { addLayer } from "~/models/factories/addLayer";
import { removeLayer } from "~/models/factories/removeLayer";
import {
  activeLayer,
  allLayers,
  layerStore,
  setLayerStore,
} from "~/stores/layerStore";
import LayerItem from "./item/LayerItem";
// 並べ替え用ユーティリティ関数

const LayerList: Component<{}> = () => {
  const [items, setItems] = createSignal(allLayers());
  const [activeItem, setActiveItem] = createSignal(null);
  const ids = () => items().map((l) => l.id);

  const onDragStart = ({ draggable }: { draggable: any }) =>
    setActiveItem(draggable.id);

  function moveLayer(draggedId: string, targetIndex: number) {
    const fromIndex = layerStore.layers.findIndex((l) => l.id === draggedId);
    if (fromIndex === -1 || fromIndex === targetIndex) return;

    const updated = [...layerStore.layers];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setLayerStore("layers", updated);
    setItems(allLayers());
  }

  const onDragEnd = ({
    draggable,
    droppable,
  }: {
    draggable: any;
    droppable: any;
  }) => {
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
    <DragDropProvider
      onDragStart={onDragStart}
      onDragEnd={(e) => {
        onDragEnd({ draggable: e.draggable, droppable: e.droppable });
      }}
      collisionDetector={closestCenter}
    >
      <DragDropSensors>
        <div class="section_root">
          <div class="fl-row" style={{ "margin-bottom": "6px" }}>
            <p class="section_caption" style={{ "flex-grow": 1 }}>
              layers.
            </p>

            <div class="fl-row" style={{ gap: "4px" }}>
              <button
                onClick={() => {
                  addLayer("new");
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
          <div class="section_content">
            <div class={styles.layer_list}>
              <SortableProvider ids={ids()}>
                <For each={items()}>
                  {(layer, index) => (
                    <LayerItem layer={layer} index={index()} />
                  )}
                </For>
              </SortableProvider>
            </div>
            {/* <DragOverlay>
                                    <div class="sortable"><LayerItem layer={activeItemLayer()} /></div>
                                </DragOverlay> */}
          </div>
        </div>
      </DragDropSensors>
    </DragDropProvider>
  );
};

export default LayerList;
