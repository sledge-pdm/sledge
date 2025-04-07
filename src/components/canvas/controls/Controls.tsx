import { Component, createSignal, For } from "solid-js";
import { initImageForLayer, redo, undo, } from "~/models/LayerImage";
import { activeImage, allLayers, canvasStore, layerStore, metricStore, setCanvasStore, setLayerStore, updateDSL, } from "~/stores/Store";

import styles from "./controls.module.css"
import DSLEditor from "~/components/common/dsl/DSLEditor";
import { DSL } from "~/dsl/DSL";

const Controls: Component<{}> = (props) => {
    const zoom = () => metricStore.zoom;
    const lastMouseCanvas = () => metricStore.lastMouseCanvas;
    const lastMouseLayer = () => metricStore.lastMouseLayer;

    const [width, setWidth] = createSignal(canvasStore.canvas.width);
    const [height, setHeight] = createSignal(canvasStore.canvas.height);

    const changeCanvasSize = (e: any) => {
        e.preventDefault();
        setCanvasStore("canvas", "width", width);
        setCanvasStore("canvas", "height", height);

        allLayers().forEach((layer, i) => {
            initImageForLayer(layer.id, layer.dotMagnification);
            updateDSL(layer.id);
        });
    }

    const resetAllLayers = (e: any) => {
        window.location.reload();
    }

    return <>
        <p>canvas.</p>

        <p>({lastMouseCanvas().x}, {lastMouseCanvas().y}) IN CANVAS.</p>
        <p>({lastMouseLayer().x}, {lastMouseLayer().y}) IN LAYER.</p>
        <p>x{zoom().toFixed(2)}</p>
        <p>UNDO STACKS.</p>
        <For each={activeImage()?.undoStack}>
            {item =>
                <p>{item.toString()}</p>
            }
        </For>
        <div class={styles["top-right-button-container"]}>
            <p class={styles.button}>out</p>
        </div>
        <div class={styles["top-right-nav"]}>
            <p class={styles.undo_redo} onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                undo(layerStore.activeLayerId)
            }}>&lt;&lt;</p>
            <p class={styles.undo_redo} onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                redo(layerStore.activeLayerId)
            }}>&gt;&gt;</p>

            {/* <div>
                <p class={styles.undo_redo} onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    await runAndApplyActive(ImageCommands.INVERT, activeImage().current);
                }}>INVERT!!</p>
                <p style={{ "font-size": "1rem" }}>{responseFromRust()}</p>
            </div> */}

            <DSLEditor />

        </div >
        <div class={styles["bottom-history"]}>

            <form onSubmit={(e) => changeCanvasSize(e)}>
                <input type="number" name="width" onChange={(e) => setWidth(Number(e.target.value))} value={width()} min={0} max={1200} required />
                <input type="number" name="height" onChange={(e) => setHeight(Number(e.target.value))} value={height()} min={0} max={1200} required />
                <button type="submit">change canvas size</button>
            </form>

            <button onClick={resetAllLayers}>RESET ALL LAYERS</button>

            <div class={styles["history-row"]}>
                <p class={styles["history-text"]}>stroke. &gt;</p>
                <p class={styles["history-text"]}>stroke. &gt;</p>
                <p class={styles["history-text"]}>erase. &gt;</p>
                <p class={styles["history-text"]}>stroke. &gt;</p>
                <p class={styles["history-text"]}>undo. &gt;</p>
                <p class={styles["history-text"]}>redo. &gt;</p>
                <p class={styles["history-text"]}>stroke. &gt;</p>
                <p class={styles["history-text"]}>erase. &gt;</p>
                <p class={styles["history-text"]}>stroke. &gt;</p>
                <p class={styles["history-text"]}>erase. &gt;</p>
                <p class={styles["history-text"]}>erase. &gt;</p>
                <p class={styles["history-text"]}>stroke. &gt;</p>
                <p class={styles["history-text"]}>stroke. &gt;</p>
                <p class={styles["history-text"]}>stroke. &gt;</p>
            </div>
        </div>
    </>;
};

export default Controls;