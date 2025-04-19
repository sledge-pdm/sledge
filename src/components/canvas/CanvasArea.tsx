import CanvasStack from "./stacks/CanvasStack";

import {
  adjustZoomToFit,
  canvasStore,
  centeringCanvas,
  setCanvasStore,
} from "~/stores/project/canvasStore";

import { createMemo, onCleanup, onMount } from "solid-js";
import Controls from "./Controls";

import CanvasAreaInteract from "./CanvasAreaInteract";
import { canvasArea } from "~/styles/components/canvas/canvas_area.css";

export default () => {
  let wrapper: HTMLDivElement;
  let canvasStack: HTMLDivElement;

  let interact: CanvasAreaInteract = new CanvasAreaInteract();

  onMount(() => {
    // set Canvas to center
    setCanvasStore("canvasAreaSize", {
      width: wrapper.clientWidth,
      height: wrapper.clientHeight,
    });
    adjustZoomToFit();
    centeringCanvas();

    interact.setInteractListeners(wrapper, canvasStack);
  });

  onCleanup(() => {
    if (interact !== undefined) {
      interact.removeInteractListeners(wrapper, canvasStack);
    }
  });

  const offsetX = () => canvasStore.offsetOrigin.x + canvasStore.offset.x;
  const offsetY = () => canvasStore.offsetOrigin.y + canvasStore.offset.y;

  const transform = createMemo(() => {
    return `translate(${offsetX()}px, ${offsetY()}px) scale(${canvasStore.zoom})`;
  });

  return (
    <div class={canvasArea}>
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
          ref={(el) => (canvasStack = el)}
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
    </div>
  );
};
