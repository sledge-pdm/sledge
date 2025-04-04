import { Component } from "solid-js";
import { JSX } from "solid-js/h/jsx-runtime";
import { metricStore } from "~/models/Store";

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

    const undo = () => { }
    const redo = () => { }

    return <>
        <p>canvas.</p>
        <p>({lastMouseCanvas().x}, {lastMouseCanvas().y}) IN CANVAS.</p>
        <p>({lastMouseLayer().x}, {lastMouseLayer().y}) IN LAYER.</p>
        <p>x{zoom().toFixed(2)}</p>
        <div style={topRightButtonContainerStyle}>
            <p style={buttonStyle}>out</p>
        </div>
        <div style={topRightNavStyle}>
            <button style={{ "font-size": "1rem" }} onClick={undo}>&lt;&lt;</button>
            <button style={{ "font-size": "1rem" }} onClick={redo}>&gt;&gt;</button>
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
    </>;
};

export default Controls;