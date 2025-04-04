import { Component, createSignal, For } from "solid-js";
import { JSX } from "solid-js/h/jsx-runtime";
import { cloneImageData, redo, undo, updateImageData } from "~/models/data/LayerImage";
import { activeImage, activeLayer, canvasStore, imageStore, layerStore, metricStore, setImageStore } from "~/models/Store";

import styles from "./controls.module.css"
import { safeInvoke } from "~/utils/tauri";
import { encodeImageData } from "~/utils/ImageUtils";
import { invertImageInRust } from "~/utils/EffectUtils";
import { ImageCommands, runAndApplyActive } from "~/models/Commands";
import CommandsList from "~/components/common/atoms/commands_list/CommandsList";

const Controls: Component<{}> = (props) => {
    const zoom = () => metricStore.zoom;

    const cursorStyle: JSX.CSSProperties = {
        "position": "absolute",
        "width": "4px",
        "height": "4px",
        "top": "170px",
        "left": "220px",
        "background-color": "black",
    };
    const topRightButtonContainerStyle: JSX.CSSProperties = {
        "position": "absolute",
        "top": "20px",
        "right": "30px",
        "display": "flex",
        "gap": "55px",
        "flex-direction": "row",
    };
    const buttonStyle: JSX.CSSProperties = {
        "font-size": "1rem",
        "background-color": "deepskyblue",
        "color": "white",
        "padding": "4px",
        "cursor": "pointer",
    };
    const topRightNavStyle: JSX.CSSProperties = {
        "position": "absolute",
        "top": "60px",
        "right": "30px",
        "display": "flex",
        "gap": "55px",
        "flex-direction": "row",
    };
    const bottomHistoryStyle: JSX.CSSProperties = {
        "position": "absolute",
        "bottom": "50px",
        "display": "flex",
        "opacity": 0.2,
        "gap": "5px",
        "flex-direction": "column",
    };
    const historyRowStyle: JSX.CSSProperties = { "display": "flex", "width": "60%", "gap": "20px" };
    const historyTextStyle: JSX.CSSProperties = { "white-space": "nowrap" };

    const lastMouseCanvas = () => metricStore.lastMouseCanvas;
    const lastMouseLayer = () => metricStore.lastMouseLayer;

    const [responseFromRust, setResponseFromRust] = createSignal("");

    const callEffect = async () => {
        console.log(cloneImageData(activeImage().current));
        const invertedImage = await invertImageInRust(cloneImageData(activeImage().current));
        console.log(invertedImage);
        if (invertedImage !== undefined) {
            updateImageData(layerStore.activeLayerId, invertedImage)
        } else {
            console.log("invert failed.");
        }
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
        <div style={topRightButtonContainerStyle}>
            <p style={buttonStyle}>out</p>
        </div>
        <div style={topRightNavStyle}>
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
        <div style={bottomHistoryStyle}>
            <div style={historyRowStyle}>
                <p style={historyTextStyle}>stroke. &gt;</p>
                <p style={historyTextStyle}>stroke. &gt;</p>
                <p style={historyTextStyle}>erase. &gt;</p>
                <p style={historyTextStyle}>stroke. &gt;</p>
                <p style={historyTextStyle}>undo. &gt;</p>
                <p style={historyTextStyle}>redo. &gt;</p>
                <p style={historyTextStyle}>stroke. &gt;</p>
                <p style={historyTextStyle}>erase. &gt;</p>
                <p style={historyTextStyle}>stroke. &gt;</p>
                <p style={historyTextStyle}>erase. &gt;</p>
                <p style={historyTextStyle}>erase. &gt;</p>
                <p style={historyTextStyle}>stroke. &gt;</p>
                <p style={historyTextStyle}>stroke. &gt;</p>
                <p style={historyTextStyle}>stroke. &gt;</p>
            </div>
        </div>
    </>;
};

export default Controls;