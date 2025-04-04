import { Component, For } from "solid-js";
import { ImageCommands, runAndApplyActive, } from "~/models/Commands";
import { activeImage, } from "~/models/Store";

const CommandsList: Component<{}> = (props) => {

    return <div style={{ display: "flex", "flex-direction": "column", gap: "5px" }}>
        <For each={Object.entries(ImageCommands)}>
            {(item, i) => <a style={{ "pointer-events": "all", cursor: "pointer" }} onClick={async () => {
                await runAndApplyActive(item[1], activeImage().current);
            }}>
                {item[1]}</a>}
        </For>
    </div>;
};

export default CommandsList;