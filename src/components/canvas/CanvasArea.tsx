import CanvasStack from "./CanvasStack";

import { canvasStore, metricStore, setMetricStore } from "~/stores/Store";

import { createSignal, onMount } from "solid-js";
import Controls from "./Controls";

import styles from "@styles/components/canvas/canvas_area.module.css";

export default () => {
  let canvasStackRef: HTMLDivElement;
  let wrapper: HTMLDivElement;

  onMount(() => {
    // set Canvas to center
    setMetricStore("offsetOrigin", {
      x: wrapper.scrollWidth / 2 - canvasStore.canvas.width / 2,
      y: wrapper.scrollHeight / 2 - canvasStore.canvas.height / 2,
    });
  });

  function addOffset(x: number, y: number) {
    setMetricStore("offset", {
      x: metricStore.offset.x + x,
      y: metricStore.offset.y + y,
    });
  }

  function setupZoomPan() {
    let lastX: number[] = [0, 0];
    let lastY: number[] = [0, 0];
    let lastDist = 0;

    wrapper.addEventListener("touchmove", (e) => {
      if (metricStore.isInStroke) return;

      if (e.touches.length === 1) {
        const xMove0 = e.touches[0].clientX - lastX[0];
        if (xMove0 !== 0 && lastX[0] !== 0) {
          addOffset(xMove0, 0);
        }
        const yMove0 = e.touches[0].clientY - lastY[0];
        if (yMove0 !== 0 && lastY[0] !== 0) {
          addOffset(0, yMove0);
        }
        lastX[0] = e.touches[0].clientX;
        lastY[0] = e.touches[0].clientY;
      }
      if (e.touches.length >= 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist =
          Math.sqrt(dx * dx + dy * dy) * metricStore.touchZoomSensitivity;
        if (lastDist !== 0) {
          const scaleFactor = dist / lastDist;
          const zoomOld = metricStore.zoom;
          const zoomNew = zoomOld * scaleFactor;
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const rect = canvasStackRef.getBoundingClientRect();
          const canvasX = (midX - rect.left) / zoomOld;
          const canvasY = (midY - rect.top) / zoomOld;
          setMetricStore("zoom", zoomNew);
          setMetricStore("offset", {
            x: metricStore.offset.x + canvasX * (zoomOld - zoomNew),
            y: metricStore.offset.y + canvasY * (zoomOld - zoomNew),
          });
        }
        const xMove0 = e.touches[0].clientX - lastX[0];
        const xMove1 = e.touches[1].clientX - lastX[1];
        const mutualMoveX = getMutualMove(xMove0, xMove1);
        if (mutualMoveX !== 0 && lastX[0] !== 0 && lastX[1] !== 0) {
          addOffset(mutualMoveX, 0);
        }
        const yMove0 = e.touches[0].clientY - lastY[0];
        const yMove1 = e.touches[1].clientY - lastY[1];
        const mutualMoveY = getMutualMove(yMove0, yMove1);
        if (mutualMoveY !== 0 && lastY[0] !== 0 && lastY[1] !== 0) {
          addOffset(0, mutualMoveY);
        }
        lastX[0] = e.touches[0].clientX;
        lastX[1] = e.touches[1].clientX;
        lastY[0] = e.touches[0].clientY;
        lastY[1] = e.touches[1].clientY;
        lastDist = dist;
      }
    });

    wrapper.addEventListener("touchend", () => {
      lastX = [0, 0];
      lastY = [0, 0];
      lastDist = 0;
    });

    wrapper.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta =
        e.deltaY > 0 ? -metricStore.wheelZoomStep : metricStore.wheelZoomStep;

      const zoomOld = metricStore.zoom;
      const zoomNew = Math.max(0.1, Math.min(8, metricStore.zoom + delta));
      const rect = canvasStackRef.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left) / zoomOld;
      const canvasY = (e.clientY - rect.top) / zoomOld;
      setMetricStore("zoom", zoomNew);
      setMetricStore("offset", {
        x: metricStore.offset.x + canvasX * (zoomOld - zoomNew),
        y: metricStore.offset.y + canvasY * (zoomOld - zoomNew),
      });
    });

    const [isDrag, setIsDrag] = createSignal(false);
    const [dragPosition, setDragPosition] = createSignal({ x: 0, y: 0 });
    const [isCtrlPressed, setCtrlPressed] = createSignal(false);

    window.addEventListener("keydown", (e) => {
      if (e.key === "Control") setCtrlPressed(true);
    });

    window.addEventListener("keyup", (e) => {
      if (e.key === "Control") setCtrlPressed(false);
    });

    wrapper.addEventListener("mousedown", (e) => {
      if (isCtrlPressed()) {
        e.preventDefault();
        e.stopPropagation();
        setIsDrag(true);
        setDragPosition({ x: e.clientX, y: e.clientY });
      }
    });

    wrapper.addEventListener("mousemove", (e) => {
      if (isCtrlPressed() && isDrag()) {
        e.preventDefault();
        e.stopPropagation();
        const dx = e.clientX - dragPosition().x;
        const dy = e.clientY - dragPosition().y;
        addOffset(dx, dy);
        setDragPosition({ x: e.clientX, y: e.clientY });
      }
    });

    wrapper.addEventListener("mouseup", (e) => {
      setIsDrag(false);
    });
    wrapper.addEventListener("mouseleave", (e) => {
      setIsDrag(false);
    });
    wrapper.addEventListener("mouseout", (e) => {
      setIsDrag(false);
    });
  }

  const offsetX = () => metricStore.offsetOrigin.x + metricStore.offset.x;
  const offsetY = () => metricStore.offsetOrigin.y + metricStore.offset.y;
  const zoom = () => metricStore.zoom;

  return (
    <div class={styles.canvas_area}>
      <div
        id="zoompan-wrapper"
        ref={(el) => {
          wrapper = el;
          setupZoomPan();
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
          ref={(el) => (canvasStackRef = el)}
          style={{
            padding: 0,
            margin: 0,
            "transform-origin": "0 0",
            transform: `translate(${offsetX()}px, ${offsetY()}px) scale(${zoom()})`,
          }}
        >
          <CanvasStack />
        </div>
      </div>

      <Controls />
    </div>
  );
};

const getMutualMove = (move0: number, move1: number) => {
  // 逆方向なら0
  if (Math.sign(move0) !== Math.sign(move1)) return 0;
  return Math.min(move1, move0);
};
