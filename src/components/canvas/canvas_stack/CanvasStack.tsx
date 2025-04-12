import { Component, createEffect, For, onMount } from "solid-js";
import { activeLayer, allLayers, canvasStore, setMetricStore } from "~/stores/Store";

import styles from "./canvas_stack.module.css"
import { TouchableCanvas } from "../touchable_canvas/TouchableCanvas";

import { metricStore } from "~/stores/Store";
import interact from "interactjs";
import { LayerCanvas, LayerCanvasRef } from "../layer_canvas/LayerCanvas";
import { DrawState, getDrawnImageData } from "~/models/layer/getDrawnImageData";
import { registerNewHistory } from "~/models/layer/layerImage";
import { cloneImageData } from "~/models/factories/utils";

const CanvasStack: Component<{}> = (props) => {

    const zoom = () => metricStore.zoom;
    let ref: HTMLDivElement;

    onMount(() => {
        interact(ref)
            .resizable({
                // resize from all edges and corners
                edges: { left: true, right: true, bottom: true, top: true },

                listeners: {
                    move(event) {
                        var target = event.target
                        var x = (parseFloat(target.getAttribute('data-x')) || 0)
                        var y = (parseFloat(target.getAttribute('data-y')) || 0)

                        // update the element's style
                        target.style.width = event.rect.width + 'px'
                        target.style.height = event.rect.height + 'px'

                        // translate when resizing from top or left edges
                        x += event.deltaRect.left
                        y += event.deltaRect.top

                        target.style.transform = 'translate(' + x + 'px,' + y + 'px)'

                        target.setAttribute('data-x', x)
                        target.setAttribute('data-y', y)
                    }
                },
                modifiers: [
                    // keep the edges inside the parent
                    interact.modifiers.restrictEdges({
                        outer: 'parent'
                    }),

                    // minimum size
                    interact.modifiers.restrictSize({
                        min: { width: 100, height: 50 }
                    })
                ],

                inertia: true
            })
            .draggable({
                listeners: {
                    move(event) {
                        event.preventDefault();
                        event.stopPropagation();
                        const target = event.target;
                        const x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
                        const y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute("data-x", x);
                        target.setAttribute("data-y", y);
                    },
                },
            })
    });

    onMount(() => {
        if (metricStore.adjustZoomOnCanvasChange) {
            let adjustedZoom = 600 / canvasStore.canvas.height;
            setMetricStore("zoom", adjustedZoom);
        }
    })

    createEffect(() => {
        if (metricStore.adjustZoomOnCanvasChange) {
            let adjustedZoom = 600 / canvasStore.canvas.height;
            setMetricStore("zoom", adjustedZoom);
        }
    })

    const layerCanvasRefs: {
        [id: string]: LayerCanvasRef;
    } = {};

    const handleDraw = (type: DrawState, position: { x: number, y: number }, lastPos?: { x: number, y: number }) => {
        const active = activeLayer();

        if (active) {
            const activeRef = layerCanvasRefs[active.id]
            if (type === DrawState.start) {
                activeRef.initDrawingBuffer()
            } else {
                const drawingBuffer = activeRef.getDrawingBuffer();
                if (drawingBuffer) {
                    const newImageData = getDrawnImageData(active.id, type, drawingBuffer, position, lastPos)

                    if (newImageData) {
                        activeRef.setImageData(newImageData);
                        if (type === DrawState.end) {
                            activeRef.resetDrawingBuffer();
                            registerNewHistory(active.id, cloneImageData(newImageData))
                        }
                    }
                }
            }
        }

    }

    return (
        <div style={{ position: "relative" }}>
            <div class={styles.canvas_stack}
                style={{
                    width: `${canvasStore.canvas.width * zoom()}px`,
                    height: `${canvasStore.canvas.height * zoom()}px`,
                }}
                onWheel={(e) => {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    const nextZoom = Math.max(0.1, Math.min(8, metricStore.zoom + delta));
                    setMetricStore("zoom", nextZoom);
                }}
            >
                <TouchableCanvas
                    zoom={zoom()}
                    onStrokeStart={(p, lp) => handleDraw(DrawState.start, p, lp)}
                    onStrokeMove={(p, lp) => handleDraw(DrawState.move, p, lp)}
                    onStrokeEnd={(p, lp) => handleDraw(DrawState.end, p, lp)} />

                <For each={allLayers()}>
                    {(layer, index) => (
                        <LayerCanvas
                            ref={layerCanvasRefs[layer.id]}
                            layer={layer}
                            zoom={zoom()}
                            zIndex={allLayers().length - index()} />
                    )}
                </For>
            </div>
            <div class={styles["resize-drag-container"]} ref={(r) => ref = r} onMouseDown={(e) => e.preventDefault()}>
                <div class={styles["image-container"]} onMouseDown={(e) => e.preventDefault()}>
                    {/* <img class={styles["resize-image"]} src="/333121.jpg" /> */}
                </div>
            </div>
        </div>
    );
};

export default CanvasStack;