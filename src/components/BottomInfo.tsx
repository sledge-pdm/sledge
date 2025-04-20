import { Component, createSignal } from "solid-js";

import {
  bottomInfoRoot,
  bottomInfoText as bottomInfoTextStyle,
} from "~/styles/components/bottom_info.css";

const [bottomInfoText, setBottomInfoText] = createSignal("");

const BottomInfo: Component<{}> = (props) => {
  return (
    <div class={bottomInfoRoot}>
      <p class={bottomInfoTextStyle}>sledge.</p>
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
