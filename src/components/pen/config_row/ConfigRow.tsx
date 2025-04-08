import { Component, createSignal } from "solid-js";
import ColorBox from "~/components/common/atoms/ColorBox";
import Light from "~/components/common/light/Light";
import Slider from "~/components/common/slider/Slider";
import { sayRandomQuote } from "~/components/common/companion/QuotePool";
import { Pen } from "~/models/types/Pen";
import { penStore, setPenStore } from "~/stores/Store";

import styles from "../pen_config.module.css"

interface ConfigRowProps {
    pen: Pen,
    isInUse: boolean,
}

const ConfigRow: Component<ConfigRowProps> = (props: ConfigRowProps) => {
    return <div class={styles.config_row}>
        <Light on={props.isInUse} />

        <p style={{ width: "20%", color: props.isInUse ? "red" : "unset", cursor: "pointer", "pointer-events": "all" }}
            onClick={() => { setPenStore({ usingIndex: penStore.pens.indexOf(props.pen) }) }}>{props.pen.name}.</p>

        <ColorBox color={props.pen.color} />

        <div style={{ "flex-grow": 1 }}>
            <Slider min={1} max={30} default={props.pen.size} onValueChanged={(newValue) => {
                sayRandomQuote("pen-resize");
                console.log("size set to " + newValue);
                const penIndex = penStore.pens.findIndex(p => p.id === props.pen.id);
                setPenStore("pens", penIndex, "size", newValue);
            }} />
        </div>

        <p style={{ width: "auto" }}>{props.pen.size}.</p>
    </div >;
};

export default ConfigRow;