import { Component } from "solid-js";
import { getNextMagnification, Layer, LayerType } from "~/models/data/Layer";
import { layerStore, setLayerStore } from "~/models/Store";

import styles from "../layer_list.module.css";
import Light from "~/components/common/atoms/light/Light";

interface LayerItemProps {
    index: number;
    layer: Layer;
}

const LayerItem: Component<LayerItemProps> = (props: LayerItemProps) => {
    let detClass: "dot" | "image" | "automate" | undefined;
    switch (props.layer.type) {
        case LayerType.Dot:
            detClass = "dot";
            break;
        case LayerType.Image:
            detClass = "image";
            break;
        case LayerType.Automate:
            detClass = "automate";
            break;
        default:
            detClass = undefined;
            break;
    }

    const onDetClicked = () => {
        setLayerStore("activeLayerId", props.layer.id);
    };

    const onPreviewClicked = () => {
        if (props.layer.type === LayerType.Image) {
            setLayerStore("imageLayer", "enabled", v => !v);
        } else {
            const indexInLayers = layerStore.layers.findIndex(
                l => l.id === props.layer.id
            );
            if (indexInLayers !== -1) {
                setLayerStore("layers", indexInLayers, "enabled", v => !v);
            }
        }
    }

    const onMagnifClicked = () => {

        let nextMagnification = getNextMagnification(props.layer.dotMagnification);
        if (props.layer.type === LayerType.Image) {
            setLayerStore("imageLayer", "dotMagnification", nextMagnification);
        } else {
            const indexInLayers = layerStore.layers.findIndex(
                l => l.id === props.layer.id
            );
            if (indexInLayers !== -1) {
                setLayerStore("layers", indexInLayers, "dotMagnification", nextMagnification);
            }
        }
    }

    const isActive = () => layerStore.activeLayerId === props.layer.id;

    return <li class={styles.layer}>
        <p class={styles.type}>{props.layer.typeDescription}</p>
        <p>{props.index}.</p>
        <div class={[
            styles.layer_det,
            detClass && styles[detClass],
            !props.layer.enabled && styles.disabled
        ]
            .filter(Boolean)
            .join(" ")}
            onClick={onDetClicked}>
            <div class={styles.layer_preview}
                onClick={onPreviewClicked} />
            <p class={styles.name}> {props.layer.name}</p>
            <div class={styles.dot_magnif_container}
                onClick={(e) => {
                    e.stopPropagation();
                    onMagnifClicked();
                }}>
                <p class={styles.dot_magnif}>x{props.layer.dotMagnification}</p>
            </div>
            <Light class={styles.active_light} on={isActive()} />
        </div>
    </li >;
};

export default LayerItem;