import { Component, For } from "solid-js";
import { colorStore } from "~/stores/internal/colorStore";

import styles from "@styles/components/section/color.module.css";
import ColorPicker from "~/components/section/item/ColorPicker";
import { setCurrentPenColor } from "~/models/types/Pen";
import ColorBox from "../common/ColorBox";

const Color: Component<{}> = (props) => {
  const onColorClicked = (color: string, index: number) => {
    setCurrentPenColor(color);
  };

  return (
    <div class="section_root">
      <p class="section_caption">color.</p>
      <div class="section_content" style={{ "flex-direction": "row", margin: "8px 0" }}>
        <div class={styles.description_container}>
          <p class={styles.swatch_description}>swatch.</p>
        </div>
        <div class={styles.swatch_container}>
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
        <div class={styles.description_container}>
          <p class={styles.picker_description}>picker.</p>
        </div>
        <ColorPicker />
      </div>
    </div>
  );
};

export default Color;
