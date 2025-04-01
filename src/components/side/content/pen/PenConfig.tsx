import { Component, For } from "solid-js";
import ConfigRow from "./config_row/ConfigRow";

import "./pen_config.css";
import { penStore } from "~/models/Store";

const PenConfig: Component<{}> = (props) => {

    return <div>
        <p>pen config.</p>
        <ul id="pen_config">
            <For each={penStore.pens}>
                {(item, index) => <ConfigRow pen={item} isInUse={index() === penStore.usingIndex} />
                }
            </For>
        </ul>
    </div>;
};

export default PenConfig;