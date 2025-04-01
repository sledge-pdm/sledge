import { Component, createSignal } from "solid-js";
import ColorBox from "~/components/common/atoms/color_box/ColorBox";
import Light from "~/components/common/atoms/light/Light";
import Slider from "~/components/common/atoms/slider/Slider";
import { sayRandomQuote } from "~/components/common/companion/QuotePool";
import { Pen } from "~/models/data/Pen";
import { penStore, setPenStore } from "~/models/Store";

interface ConfigRowProps {
    pen: Pen,
    isInUse: boolean,
}

const ConfigRow: Component<ConfigRowProps> = (props: ConfigRowProps) => {
    const [penSize, setPenSize] = createSignal(props.pen.size);

    return <div class="config_row">
        <Light on={props.isInUse} />

        <p style={{ width: "20%", color: props.isInUse ? "red" : "unset", cursor: "pointer", "pointer-events": "all" }}
            onClick={() => { setPenStore({ usingIndex: penStore.pens.indexOf(props.pen) }) }}>{props.pen.name}.</p>

        <ColorBox color={props.pen.color} />

        <div style={{ "flex-grow": 1 }}>
            <Slider min={1} max={10} default={props.pen.size} onValueChanged={(newValue) => {
                sayRandomQuote("pen-resize");
                setPenSize(newValue);
            }} />
        </div>

        <p style={{ width: "auto" }}>{penSize()}.</p>
    </div >;
};

export default ConfigRow;