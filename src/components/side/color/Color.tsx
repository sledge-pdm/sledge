import { Component, For, JSX } from "solid-js";
import ColorBox from "~/components/common/color_box/ColorBox";
import { colorStore, penStore, setPenStore } from "~/stores/Store";

import styles from "./color.module.css"
import ColorPicker from "~/components/common/color_picker/ColorPicker";
import { setCurrentPenColor } from "~/models/Pen";

const Color: Component<{}> = (props) => {

    const onColorClicked = (color: string, index: number) => {
        setCurrentPenColor(color);
    }

    return <div>
        <p>color.</p>
        <div class={styles.color_content}>
            <div class={styles.color_picker}><ColorPicker /></div>
            <div class={styles.swatch_container}>
                <For each={colorStore.swatches}>
                    {(item, index) => <ColorBox
                        color={item}
                        sizePx={14}
                        onClick={(color) => onColorClicked(color, index())}
                        enableUsingSelection={true} />}
                </For>
            </div>
        </div>
    </div>;
};

export default Color;