import interact from "interactjs";
import { Component, onMount } from "solid-js";

import styles from "@styles/components/canvas/image_pool.module.css";

const ImagePool: Component<{}> = (props) => {
  let imageRef: HTMLDivElement;

  onMount(() => {
    interact(imageRef)
      .resizable({
        // resize from all edges and corners
        edges: { left: true, right: true, bottom: true, top: true },

        listeners: {
          move(event) {
            var target = event.target;
            var x = parseFloat(target.getAttribute("data-x")) || 0;
            var y = parseFloat(target.getAttribute("data-y")) || 0;

            // update the element's style
            target.style.width = event.rect.width + "px";
            target.style.height = event.rect.height + "px";

            // translate when resizing from top or left edges
            x += event.deltaRect.left;
            y += event.deltaRect.top;

            target.style.transform = "translate(" + x + "px," + y + "px)";

            target.setAttribute("data-x", x);
            target.setAttribute("data-y", y);
          },
        },
        modifiers: [
          // keep the edges inside the parent
          interact.modifiers.restrictEdges({
            outer: "parent",
          }),

          // minimum size
          interact.modifiers.restrictSize({
            min: { width: 100, height: 50 },
          }),
        ],

        inertia: true,
      })
      .draggable({
        listeners: {
          move(event) {
            event.preventDefault();
            event.stopPropagation();
            const target = event.target;
            const x =
              (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
            const y =
              (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute("data-x", x);
            target.setAttribute("data-y", y);
          },
        },
      });
  });

  return (
    <div
      class={styles["resize-drag-container"]}
      ref={(r) => (imageRef = r)}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div
        class={styles["image-container"]}
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* <img class={styles["resize-image"]} src="/333121.jpg" /> */}
      </div>
    </div>
  );
};

export default ImagePool;
