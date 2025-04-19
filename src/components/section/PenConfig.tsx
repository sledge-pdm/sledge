import { Component, For } from "solid-js";
import { penStore } from "~/stores/internal/penStore";
import PenItem from "./item/PenItem";
import { sectionCaption, sectionContent, sectionRoot } from "~/styles/section_global.css";

const PenConfig: Component<{}> = (props) => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>pen config.</p>
      <div class={sectionContent}>
        <For each={penStore.pens}>
          {(item, index) => (
            <PenItem pen={item} isInUse={index() === penStore.usingIndex} />
          )}
        </For>
      </div>
    </div>
  );
};

export default PenConfig;
