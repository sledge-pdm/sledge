import { Component } from "solid-js";
import { currentPen, penStore } from "~/stores/internal/penStore";
import { canvasStore } from "~/stores/project/canvasStore";

const CanvasOverlaySVG: Component<{}> = (props) => {

    const borderWidth = () => canvasStore.canvas.width * canvasStore.zoom
    const borderHeight = () => canvasStore.canvas.width * canvasStore.zoom

    const zoomedPenSize = () => currentPen().size * canvasStore.zoom

    return <svg viewBox={`0 0 ${borderWidth()} ${borderHeight()}`} xmlns="http://www.w3.org/2000/svg"
        style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            "pointer-events": "none",
            "image-rendering": "pixelated"
        }}>

        {/* border rect */}
        <rect width={borderWidth()} height={borderHeight()} fill="none" stroke="black" stroke-width={1} />

        {/* pen hover preview */}
        <rect
            width={zoomedPenSize()}
            height={zoomedPenSize()}
            x={canvasStore.lastMouseOnZoomedCanvas.x - zoomedPenSize() / 2}
            y={canvasStore.lastMouseOnZoomedCanvas.y - zoomedPenSize() / 2}
            fill="none"
            stroke="black"
            stroke-width={1} />
    </svg>
};

export default CanvasOverlaySVG;