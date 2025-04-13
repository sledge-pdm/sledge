import CanvasStack from "./stacks/CanvasStack";

import { metricStore, setMetricStore } from '~/stores/metricStore';
import { canvasStore } from '~/stores/canvasStore';

import { createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import Controls from "./Controls";

import styles from "@styles/components/canvas/canvas_area.module.css";
import CanvasAreaInteract from "./CanvasAreaInteract";

export default () => {
  let wrapper: HTMLDivElement;
  let canvasStack: HTMLDivElement;

  let interact: CanvasAreaInteract = new CanvasAreaInteract();;

  onMount(() => {
    // set Canvas to center
    setMetricStore("offsetOrigin", {
      x: wrapper.scrollWidth / 2 - canvasStore.canvas.width / 2,
      y: wrapper.scrollHeight / 2 - canvasStore.canvas.height / 2,
    });
    interact.setInteractListeners(wrapper, canvasStack);
  })

  onCleanup(() => {
    if (interact !== undefined) {
      interact.removeInteractListeners(wrapper, canvasStack);
    }
  })


  const transform = createMemo(() => {
    return `translate(${metricStore.offsetOrigin.x + metricStore.offset.x}px, ${metricStore.offsetOrigin.y + metricStore.offset.y}px) scale(${metricStore.zoom})`;
  });

  return (
    <div class={styles.canvas_area}>
      <div
        id="zoompan-wrapper"
        ref={(el) => {
          wrapper = el;
        }}
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          padding: 0,
          margin: 0,
          width: "100%",
          height: "100%",
          "touch-action": "none",
        }}
      >
        <div
          ref={(el) => canvasStack = el}
          style={{
            padding: 0,
            margin: 0,
            "transform-origin": "0 0",
            transform: transform(),
          }}
        >
          <CanvasStack />
        </div>
      </div>

      <Controls />
    </div >
  );
};