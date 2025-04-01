import { JSX } from "solid-js";
import CanvasStack from "./canvas_stack/CanvasStack";

import styles from "./canvas_area.module.css"

export default () => {
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

    return (
        <div class={styles.canvas_area}>
            <p>canvas.</p>
            <p>(170, 220)</p>

            <div class={styles.canvas_stack_container}>
                <CanvasStack />
            </div>
            <div style={topRightButtonContainerStyle}>
                <p style={buttonStyle}>out</p>
            </div>
            <div style={topRightNavStyle}>
                <p style={{ "font-size": "1rem" }}>&gt;&gt;</p>
                <p style={{ "font-size": "1rem" }}>&gt;&gt;</p>
            </div>
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
        </div>
    );
}