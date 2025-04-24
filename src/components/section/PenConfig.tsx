import { Component, For } from "solid-js";
import { toolStore } from "~/stores/internal/toolsStore";
import {
  sectionCaption,
  sectionContent,
  sectionRoot,
} from "~/styles/section_global.css";
import PenItem from "./item/PenItem";
import PenSize from "./item/PenSize";

const PenConfig: Component<{}> = (props) => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>pen config.</p>
      <div class={sectionContent}>
        <PenSize />
        <For each={toolStore.tools}>
          {(item, index) => (
            <PenItem pen={item} isInUse={index() === toolStore.usingIndex} />
          )}
        </For>
      </div>
    </div>
  );
};

export default PenConfig;
