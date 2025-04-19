import { Component } from "solid-js";
import Project from "./section/Project";
import Color from "./section/Color";
import PenConfig from "./section/PenConfig";
import LayerList from "./section/LayerList";
import CanvasSettings from "./section/CanvasSettings";

import styles from "@styles/components/side_sections.module.css"

const SideSections: Component<{}> = (props) => {
    return <div class={styles.content}>
        <a onClick={() => window.location.href = "/"}>&lt; back</a>
        <Project />
        <Color />
        <PenConfig />
        <LayerList />
        <CanvasSettings />
    </div>;
};

export default SideSections;