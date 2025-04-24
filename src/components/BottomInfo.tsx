import { Component, createSignal } from "solid-js";
import { AboutWindowOptions } from "~/routes/about";

import {
  bottomInfoRoot,
  bottomInfoText as bottomInfoTextStyle,
} from "~/styles/components/bottom_info.css";
import { openSingletonWindow } from "~/utils/windowUtils";

const [bottomInfoText, setBottomInfoText] = createSignal("");

const BottomInfo: Component<{}> = (props) => {
  return (
    <div class={bottomInfoRoot}>
      <p
        class={bottomInfoTextStyle}
        style={{ "pointer-events": "all", cursor: "pointer" }}
        onClick={() => openSingletonWindow("about", AboutWindowOptions)}
      >
        sledge.
      </p>
      &nbsp;
      <p class={bottomInfoTextStyle}>{bottomInfoText()}</p>
      {/* <p class={sideAreaEdgeText}>{projectStore.name || "name N/A"}</p> */}
    </div>
  );
};

export const setBottomInfo = (text: string) => {
  setBottomInfoText(text);
};

export default BottomInfo;
