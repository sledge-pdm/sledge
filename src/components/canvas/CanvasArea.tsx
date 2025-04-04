import CanvasStack from "./canvas_stack/CanvasStack";

import styles from "./canvas_area.module.css"
import Controls from "./controls/Controls";

export default () => {

    return (
        <div class={styles.canvas_area}>
            <div class={styles.canvas_stack_container}>
                <CanvasStack />
            </div>

            <Controls />
        </div>
    );
}