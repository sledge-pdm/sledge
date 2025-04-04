import { Component, For } from "solid-js";
import LayerItem from "./layer_item/LayerItem";
import { layerStore } from "~/models/Store";

import styles from "./layer_list.module.css";

const Arrow = <svg
    class={styles.image_insert_arrow}
    xmlns="http://www.w3.org/2000/svg"
>
    <defs>
        <marker
            id="arrow"
            viewBox="0 0 10 5"
            refX="5"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
        >
            <path d="M 0 0 L 10 5 L 0 5 z" />
        </marker>
    </defs>
    <path
        d="M 10 45 h -17 v 194 h 8"
        fill="none"
        stroke-width="1px"
        shape-rendering="optimizeSpeed"
        stroke="black"
        marker-end="url(#arrow)"
    />
</svg>;

const LayerList: Component<{}> = (props) => {

    return <div>
        <p>layers.</p>
        <div style={{ display: "flex" }}>
            {Arrow}
            <div style={{ width: "100%" }}>
                <ul class={styles.layer_list}>
                    <LayerItem index={1} layer={layerStore.imageLayer} />
                    <p>+ IN</p>
                </ul>
                <ul class={styles.layer_list}>
                    <For each={layerStore.layers}>
                        {(layer, i) => (
                            <LayerItem index={i()} layer={layer} />
                        )}
                    </For>
                </ul>
            </div>
        </div></div>;
};

export default LayerList;