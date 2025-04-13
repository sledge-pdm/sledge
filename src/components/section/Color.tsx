import { Component, For } from "solid-js";
import { colorStore } from "~/stores/internal/colorStore";

import styles from "@styles/components/section/color.module.css";
import ColorPicker from "~/components/common/ColorPicker";
import { setCurrentPenColor } from "~/models/types/Pen";
import ColorBox from "../common/ColorBox";

const Color: Component<{}> = (props) => {
  const onColorClicked = (color: string, index: number) => {
    setCurrentPenColor(color);
  };

  return (
    <div class="section_root">
      <p class="section_caption">color.</p>
      <div class="section_content">
        <div class={styles.color_picker}>
          <ColorPicker />
        </div>
        <div class={styles.swatch_container}>
          <For each={colorStore.swatches}>
            {(item, index) => (
              <ColorBox
                color={item}
                sizePx={14}
                onClick={(color) => onColorClicked(color, index())}
                enableUsingSelection={true}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

export default Color;
