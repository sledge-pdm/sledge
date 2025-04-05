import { Component, For } from "solid-js";
import ConfigRow from "./config_row/ConfigRow";

import styles from "./pen_config.module.css";
import { penStore } from "~/stores/Store";

const PenConfig: Component<{}> = (props) => {

    return <div>
        <p>pen config.</p>
        <ul class={styles.pen_config}>
            <For each={penStore.pens}>
                {(item, index) => <ConfigRow pen={item} isInUse={index() === penStore.usingIndex} />
                }
            </For>
        </ul>
    </div>;
};

export default PenConfig;