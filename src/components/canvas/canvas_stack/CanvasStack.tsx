import { Component, For, onMount } from "solid-js";
import { allLayers, canvasStore, setMetricStore } from "~/models/Store";

import styles from "./canvas_stack.module.css"
import { DrawableCanvas } from "../drawable_canvas/DrawableCanvas";

import { metricStore } from "~/models/Store";

const CanvasStack: Component<{}> = (props) => {
    const zoom = () => metricStore.zoom;
    onMount(() => {
        if (metricStore.adjustZoomOnCanvasChange) {
            let adjustedZoom = 600 / canvasStore.canvas.height;
            setMetricStore("zoom", adjustedZoom);
        }
    })

    return (
        <div class={styles.canvas_stack}
            style={{
                width: `${canvasStore.canvas.width * zoom()}px`,
                height: `${canvasStore.canvas.height * zoom()}px`,
            }}
            onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                const nextZoom = Math.max(0.1, Math.min(8, metricStore.zoom + delta));
                setMetricStore("zoom", nextZoom);
            }}
        >
            <For each={allLayers()}>
                {(layer, index) => (
                    <DrawableCanvas
                        layer={layer}
                        zoom={zoom()}
                        zIndex={index()} />
                )}
            </For>
        </div>
    );
};

export default CanvasStack;