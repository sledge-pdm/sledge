import { Component } from "solid-js";
import { Layer, LayerType } from "~/models/data/Layer";
import { layerStore, setLayerStore } from "~/models/Store";

interface LayerItemProps {
    index: number;
    layer: Layer;
}

const LayerItem: Component<LayerItemProps> = (props: LayerItemProps) => {
    let detClass;
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
            detClass = "";
            break;
    }

    const onDetClicked = () => {
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
    };

    return <li id="layer">
        <p id="type">{props.layer.typeDescription}</p>
        <p>{props.index}.</p>
        <div class={`layer_det ${detClass} ${props.layer.enabled ? "" : "disabled"}`} /** .disabled = opacity: 0.4 */
            onClick={onDetClicked}>
            <div id="layer_preview" />
            <p id="name">{props.layer.name}</p>
        </div>
    </li>;
};

export default LayerItem;