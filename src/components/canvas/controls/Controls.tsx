import { Component, createSignal, For } from "solid-js";
import { initImageForLayer, redo, undo, } from "~/models/data/LayerImage";
import { activeImage, allLayers, canvasStore, layerStore, metricStore, setCanvasStore, } from "~/models/Store";

import styles from "./controls.module.css"
import CommandsList from "~/components/common/atoms/commands_list/CommandsList";

const Controls: Component<{}> = (props) => {
    const zoom = () => metricStore.zoom;
    const lastMouseCanvas = () => metricStore.lastMouseCanvas;
    const lastMouseLayer = () => metricStore.lastMouseLayer;

    const [width, setWidth] = createSignal(0);
    const [height, setHeight] = createSignal(0);

    const changeCanvasSize = (e: any) => {
        e.preventDefault();
        setCanvasStore("canvas", "width", width);
        setCanvasStore("canvas", "height", height);
    }

    const resetAllLayers = (e: any) => {
        allLayers().forEach(layer => {
            initImageForLayer(layer.id, layer.dotMagnification);
        });
    }

    return <>
        <p>canvas.</p>

        <p>({lastMouseCanvas().x}, {lastMouseCanvas().y}) IN CANVAS.</p>
        <p>({lastMouseLayer().x}, {lastMouseLayer().y}) IN LAYER.</p>
        <p>x{zoom().toFixed(2)}</p>
        <p>UNDO STACKS.</p>
        <For each={activeImage().undoStack}>
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

            <CommandsList />

        </div >
        <div class={styles["bottom-history"]}>

            <form onSubmit={(e) => changeCanvasSize(e)}>
                <input type="number" name="width" onChange={(e) => setWidth(Number(e.target.value))} value={canvasStore.canvas.width} min={0} max={1200} required />
                <input type="number" name="height" onChange={(e) => setHeight(Number(e.target.value))} value={canvasStore.canvas.height} min={0} max={1200} required />
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