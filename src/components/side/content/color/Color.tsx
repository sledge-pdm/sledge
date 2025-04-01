import { Component, For, JSX } from "solid-js";
import ColorBox from "~/components/common/atoms/color_box/ColorBox";
import { colorStore, penStore, setColorStore, setPenStore } from "~/models/Store";

import "./color.css"

const Color: Component<{}> = (props) => {
    const colorBoxContainerStyle: JSX.CSSProperties = {
        "position": "relative",
        "display": "flex",
        "width": "fit-content",
        "flex-direction": "column",
        "margin-left": "10px",
    };
    const colorBoxSpoilStyle: JSX.CSSProperties = {
        "position": "absolute",
        "top": 0,
        "right": 0,
        "font-size": "0.5rem",
    };
    const colorRowStyle: JSX.CSSProperties = {
        "display": "flex",
        "flex-direction": "row",
        "gap": "5px",
        "margin": "10px 0 30px 0",
    };

    const onColorClicked = (color: string, index: number) => {
        setPenStore("pens", penStore.usingIndex, "color", color);
    }

    return <div>
        <p>color.</p>
        <div style={colorBoxContainerStyle}>
            <p style={colorBoxSpoilStyle}>[ spoil ]</p>
            <div id="color_picker" />
            <div style={colorRowStyle}>
                <For each={colorStore.swatches}>
                    {(item, index) => <ColorBox
                        color={item}
                        sizePx={14}
                        onClick={(color) => onColorClicked(color, index())}
                        enableUsingSelection={true} />}
                </For>
            </div>
        </div>
    </div>;
};

export default Color;