import { Component, For } from "solid-js";
import { allLayers } from "~/models/Store";

import styles from "./canvas_stack.module.css"

const CanvasStack: Component<{}> = (props) => {
    let canvasWidth = 400;
    let canvasHeight = 600;

    const canvasMap = new Map<string, HTMLCanvasElement>();

    function registerCanvasRef(id: string, el: HTMLCanvasElement | null) {
        if (el) {
            canvasMap.set(id, el);
        } else {
            canvasMap.delete(id);
        }
    }

    const isDev = true;

    return <div class={styles.canvas_stack}>
        <For each={allLayers()}>
            {(layer, index) => (
                <canvas
                    id={`canvas-${layer.id}`}
                    classList={{
                        [styles["layer-canvas"]]: true,
                        [styles["dev-hint"]]: isDev,
                        [styles["hidden"]]: !layer.enabled,
                    }}
                    data-layer-id={layer.name}
                    style={{
                        'z-index': index(),
                    }}
                    width={canvasWidth}
                    height={canvasHeight}
                    ref={(el) => registerCanvasRef(layer.id, el)}
                ></canvas>
            )}
        </For>

    </div>;
};

export default CanvasStack;