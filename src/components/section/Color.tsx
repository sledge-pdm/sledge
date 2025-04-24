import { Component, For } from "solid-js";
import { colorStore, setCurrentColor } from "~/stores/internal/colorStore";

import ColorPicker from "~/components/section/item/ColorPicker";
import {
  colorElemDescription,
  descriptionContainer,
  swatchContainer,
} from "~/styles/section/color.css";
import {
  sectionCaption,
  sectionContent,
  sectionRoot,
} from "~/styles/section_global.css";
import ColorBox from "../common/ColorBox";
import Palette from "./item/Palette";

const Color: Component<{}> = (props) => {
  const onColorClicked = (color: string, index: number) => {
    setCurrentColor(color);
  };

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>color.</p>
      <div
        class={sectionContent}
        style={{ "flex-direction": "row", margin: "8px 0" }}
      >
        <div class={swatchContainer}>
          <For each={colorStore.swatches}>
            {(item, index) => (
              <ColorBox
                color={item}
                sizePx={8}
                onClick={(color) => onColorClicked(color, index())}
                enableUsingSelection={true}
              />
            )}
          </For>
        </div>
        <div class={descriptionContainer}>
          <p class={colorElemDescription}>picker.</p>
        </div>
        <ColorPicker width={150} />
      </div>
      <Palette />
    </div>
  );
};

export default Color;
