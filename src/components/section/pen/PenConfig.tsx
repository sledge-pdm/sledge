import { Component, For } from "solid-js";
import ConfigRow from "./ConfigRow";

import { penStore } from "~/stores/Store";

const PenConfig: Component<{}> = (props) => {
  return (
    <div class="section_root">
      <p class="section_caption">pen config.</p>
      <div class="section_content">
        <For each={penStore.pens}>
          {(item, index) => (
            <ConfigRow pen={item} isInUse={index() === penStore.usingIndex} />
          )}
        </For>
      </div>
    </div>
  );
};

export default PenConfig;
