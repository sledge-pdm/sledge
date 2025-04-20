import { Component } from "solid-js";
import CanvasSettings from "./section/CanvasSettings";
import Color from "./section/Color";
import LayerList from "./section/LayerList";
import PenConfig from "./section/PenConfig";
import Project from "./section/Project";

import { sideAreaContent } from "~/styles/global.css";

const SideSections: Component<{}> = (props) => {
  return (
    <div class={sideAreaContent}>
      <a onClick={() => (window.location.href = "/")}>&lt; back</a>
      <Project />
      <Color />
      <PenConfig />
      <LayerList />
      <CanvasSettings />
    </div>
  );
};

export default SideSections;
