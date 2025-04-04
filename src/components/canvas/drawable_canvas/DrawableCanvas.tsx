import { Component, onMount, onCleanup, createEffect } from "solid-js";
import { penStore, layerStore, canvasStore, setMetricStore, imageStore, hexToRGB } from "~/models/Store";
import styles from "./drawable_canvas.module.css";
import { Layer } from "~/models/data/Layer";
import { cloneImageData, redo, undo, updateImageData } from "~/models/data/LayerImage";
import { drawLine, roundPosition } from "~/utils/MetricUtils";
import { drawBrush } from "~/utils/BrushUtils";
import { setPixel } from "~/utils/ImageUtils";

type Props = {
    layer: Layer;
    zoom: number;
    zIndex: number;
};

export const DrawableCanvas: Component<Props> = (props) => {
    let canvasRef: HTMLCanvasElement | undefined;
    let ctx: CanvasRenderingContext2D | null = null;
    let lastPos: { x: number; y: number } | null = null;

    const totalMag = () => props.layer.dotMagnification * props.zoom;

    const currentPen = () => penStore.pens[penStore.usingIndex];
    const isActiveLayer = () => props.layer.id === layerStore.activeLayerId;

    const internalWidth = () => canvasStore.canvas.width / props.layer.dotMagnification;
    const internalHeight = () => canvasStore.canvas.height / props.layer.dotMagnification;

    const styleWidth = () => internalWidth() * totalMag();
    const styleHeight = () => internalHeight() * totalMag();

    function getOffset() {
        const rect = canvasRef!.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
    }

    function shouldDraw(): boolean {
        if (!props.layer || !isActiveLayer()) return false;
        if (!props.layer.enabled) {
            // companionSay("it's disabled layer.");
            return false;
        }
        return true;
    }

    function isMouseOnCanvas(e: MouseEvent) {
        const offset = getOffset();
        const mouseCanvasPos = roundPosition({
            x: e.clientX - offset.x,
            y: e.clientY - offset.y
        });
        // check if mouse on canvas
        if (mouseCanvasPos.x < 0 || styleWidth() < mouseCanvasPos.x || mouseCanvasPos.y < 0 || styleHeight() < mouseCanvasPos.y) return false;
        else return true;
    }

    let drawingBuffer: ImageData | null = null;

    function handlePointerDown(e: PointerEvent) {
        if (!shouldDraw() || !isMouseOnCanvas(e)) return;
        const offset = getOffset();
        lastPos = roundPosition({
            x: (e.clientX - offset.x) / totalMag(),
            y: (e.clientY - offset.y) / totalMag()
        });
        console.log("pointer down. stroke started");
        drawingBuffer = cloneImageData(imageStore[props.layer.id].current);
    }

    function handlePointerMove(e: PointerEvent) {
        if (!ctx) return;
        const offset = getOffset();
        const mouseCanvasPos = roundPosition({
            x: e.clientX - offset.x,
            y: e.clientY - offset.y
        });
        const mouseLayerPos = roundPosition({
            x: (e.clientX - offset.x) / totalMag(),
            y: (e.clientY - offset.y) / totalMag()
        });
        setMetricStore("lastMouseCanvas", mouseCanvasPos);
        setMetricStore("lastMouseLayer", mouseLayerPos);

        if (!lastPos || !lastPos.x || !lastPos.y) return;

        if (!shouldDraw()) return;
        if (!drawingBuffer) return;

        if (!isMouseOnCanvas(e)) {
            endStroke();
        }

        // draw into drawingBuffer instead of imageStore
        const imageData = drawingBuffer;
        const pen = currentPen();
        const [r, g, b] = hexToRGB(pen.color);

        drawBrush(mouseLayerPos.x, mouseLayerPos.y, pen.size, (x, y) => {
            if (pen.name === "eraser") {
                setPixel(imageData, x, y, 0, 0, 0, 0);
            } else {
                setPixel(imageData, x, y, r, g, b, 255);
            }
        });

        drawLine(lastPos.x, lastPos.y, mouseLayerPos.x, mouseLayerPos.y, (x, y) => {
            drawBrush(x, y, pen.size, (px, py) => {
                if (pen.name === "eraser") {
                    setPixel(imageData, x, y, 0, 0, 0, 0);
                } else {
                    setPixel(imageData, px, py, r, g, b, 255);
                }
            });
        });
        ctx.putImageData(imageData, 0, 0);
        lastPos = mouseLayerPos;
    }

    function handlePointerUp(e: MouseEvent) {
        if (!isMouseOnCanvas(e)) return;
        console.log("pointer up. stroke end");
        endStroke();
    }

    function endStroke() {
        if (drawingBuffer) {
            updateImageData(props.layer.id, drawingBuffer);
            drawingBuffer = null;
        }
        lastPos = null;
    }

    onMount(() => {
        ctx = canvasRef?.getContext("2d") ?? null;

        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        window.addEventListener("keydown", handleKeydown);
    });

    function handleKeydown(e: KeyboardEvent) {
        if (e.ctrlKey && e.key === "z") {
            undo(layerStore.activeLayerId);
        } else if (e.ctrlKey && e.key === "y") {
            redo(layerStore.activeLayerId);
        }
    }

    onCleanup(() => {
        window.removeEventListener("pointerdown", handlePointerDown);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("keydown", handleKeydown);
    });

    createEffect(() => {
        const current = imageStore[props.layer.id].current;
        if (ctx && current) {
            ctx.putImageData(current, 0, 0);
        }
    });



    return (
        <canvas
            ref={canvasRef}
            id={`canvas-${props.layer.id}`}
            data-layer-id={props.layer.name}
            classList={{
                [styles["layer-canvas"]]: true,
                [styles["dev-hint"]]: false,
                [styles["hidden"]]: !props.layer.enabled,
            }}
            width={internalWidth()}
            height={internalHeight()}
            style={{
                width: `${styleWidth()}px`,
                height: `${styleHeight()}px`,
                "z-index": props.zIndex,
            }}
        />
    );
};
