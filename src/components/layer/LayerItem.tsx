import { Component, createSignal } from "solid-js";
import { Layer, LayerType } from "~/models/types/Layer";
import { allLayers, layerStore, setLayerStore } from "~/stores/Store";
import styles from "./layer_list.module.css";
import Light from "~/components/common/light/Light";
import { createSortable, useDragDropContext } from "@thisbeyond/solid-dnd";
import DSLButton from "../common/atoms/DSLButton";
import { getNextMagnification } from "~/models/factories/utils";

interface LayerItemProps {
    layer: Layer;
    draggingId?: string | null;
}

const LayerItem: Component<LayerItemProps> = (props) => {
    const {
        layer, draggingId
    } = props

    const sortable = createSortable(layer.id);
    const context = useDragDropContext();
    const state = context?.[0];

    const index = () => allLayers().indexOf(layer);

    let detClass: "dot" | "image" | "automate" | undefined;
    switch (layer.type) {
        case LayerType.Dot: detClass = "dot"; break;
        case LayerType.Image: detClass = "image"; break;
        case LayerType.Automate: detClass = "automate"; break;
    }

    const onDetClicked = () => {
        setLayerStore("activeLayerId", layer.id);
    };

    const onPreviewClicked = () => {
        if (index() !== -1) {
            setLayerStore("layers", index(), "enabled", (v: boolean) => !v);
        }
    };

    const onMagnifClicked = () => {
        const next = getNextMagnification(layer.dotMagnification);
        if (index() !== -1) {
            setLayerStore("layers", index(), "dotMagnification", next);
        }
    };

    const isActive = () => layerStore.activeLayerId === layer.id;

    return (
        <div
            class={styles.layer}
            classList={{
                "opacity-50": sortable.isActiveDraggable,
                "transition-transform": state && !!state.active.draggable
            }}
            style={{ opacity: draggingId === layer.id ? 0.4 : 1 }}
            ref={sortable}>
            <p class={styles.type}>{layer.typeDescription}</p>
            <p>{index()}.</p>
            <div style={{ display: "flex", "align-items": "center" }}>
                <DSLButton />
                <div
                    class={[
                        styles.layer_det,
                        detClass && styles[detClass],
                        !layer.enabled && styles.disabled,
                    ].filter(Boolean).join(" ")}
                    onClick={onDetClicked}
                >
                    <div class={styles.layer_preview} onClick={onPreviewClicked} />
                    <p class={styles.name}> {layer.name}</p>
                    <div
                        class={styles.dot_magnif_container}
                        onClick={(e) => {
                            e.stopPropagation();
                            onMagnifClicked();
                        }}
                        onMouseOver={(e) => e.stopPropagation()}
                    >
                        <p class={styles.dot_magnif}>x{layer.dotMagnification}</p>
                    </div>

                </div>
                <Light class={styles.active_light} on={isActive()} />
            </div>
        </div>
    );
};

export default LayerItem;
