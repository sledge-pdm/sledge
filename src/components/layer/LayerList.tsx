import { Component, For, createSignal } from "solid-js";
import LayerItem from "./LayerItem";
import { allLayers, layerStore, setLayerStore } from "~/stores/Store";
import styles from "./layer_list.module.css";
import { Arrow } from "./Arrow";
import { closestCenter, DragDropProvider, DragDropSensors, DragOverlay, SortableProvider, } from "@thisbeyond/solid-dnd";

// 並べ替え用ユーティリティ関数

const LayerList: Component<{}> = () => {
    const [items, setItems] = createSignal(allLayers());
    const [activeItem, setActiveItem] = createSignal(null);
    const activeItemLayer = () => items().find(i => i.id === activeItem());
    const ids = () => items().map(l => l.id);

    const onDragStart = ({ draggable }: { draggable: any }) => setActiveItem(draggable.id);


    function moveLayer(draggedId: string, targetIndex: number) {
        const fromIndex = layerStore.layers.findIndex(l => l.id === draggedId);
        if (fromIndex === -1 || fromIndex === targetIndex) return;

        const updated = [...layerStore.layers];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(targetIndex, 0, moved);
        setLayerStore("layers", updated);
        setItems(allLayers())
    }

    const onDragEnd = ({ draggable, droppable }: {
        draggable: any;
        droppable: any;
    }) => {
        if (draggable && droppable) {
            const currentItems = ids();
            const fromIndex = currentItems.indexOf(draggable.id);
            const toIndex = currentItems.indexOf(droppable.id);
            if (fromIndex !== toIndex) {
                moveLayer(draggable.id, toIndex)
            }
        }
    };

    return (
        <DragDropProvider
            onDragStart={onDragStart}
            onDragEnd={(e) => { onDragEnd({ draggable: e.draggable, droppable: e.droppable }) }}
            collisionDetector={closestCenter}>
            <DragDropSensors>
                <div>
                    <p class={styles.caption}>layers.</p>
                    <div style={{ display: "flex" }}>
                        {/* {Arrow} */}
                        <div style={{ width: "100%" }}>
                            <div class="column self-stretch">
                                <div class={styles.layer_list}>
                                    <SortableProvider ids={ids()}>
                                        <For each={items()}>
                                            {(layer) => (
                                                <LayerItem layer={layer} />
                                            )}
                                        </For>
                                    </SortableProvider>
                                </div>
                                {/* <DragOverlay>
                                    <div class="sortable"><LayerItem layer={activeItemLayer()} /></div>
                                </DragOverlay> */}
                            </div>
                        </div>
                    </div>
                    <br />
                    {/* <p style={{ opacity: 0.45 }}>
                        click item &gt; change active layer.<br />
                        click left box &gt; hide/show layer.<br /><br />
                        click x button &gt; change layer dotmult.<br />
                        (! This will erase content.)
                    </p> */}
                </div>
            </DragDropSensors>
        </DragDropProvider>
    );
};

export default LayerList;
