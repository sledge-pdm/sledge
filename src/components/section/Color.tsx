import { Component, For } from "solid-js";
import { colorStore } from "~/stores/internal/colorStore";

import ColorPicker from "~/components/section/item/ColorPicker";
import { setCurrentPenColor } from "~/models/types/Pen";
import ColorBox from "../common/ColorBox";
import { sectionCaption, sectionContent, sectionRoot } from "~/styles/section_global.css";
import { colorElemDescription, descriptionContainer, swatchContainer } from "~/styles/section/color.css";

const Color: Component<{}> = (props) => {
  const onColorClicked = (color: string, index: number) => {
    setCurrentPenColor(color);
  };

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>color.</p>
      <div class={sectionContent} style={{ "flex-direction": "row", margin: "8px 0" }}>
        <div class={descriptionContainer}>
          <p class={colorElemDescription}>swatch.</p>
        </div>
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
        <ColorPicker />
      </div>
    </div>
  );
};

export default Color;
