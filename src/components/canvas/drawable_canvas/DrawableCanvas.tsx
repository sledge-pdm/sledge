import { Component, onMount, onCleanup } from "solid-js";
import { penStore, layerStore, canvasStore, setMetricStore } from "~/models/Store";
import styles from "./drawable_canvas.module.css";
import { Layer } from "~/models/data/Layer";
import { smartSay as companionSay } from "~/components/common/companion/Companion";

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

    function handlePointerDown(e: PointerEvent) {
        if (!shouldDraw()) return;
        const offset = getOffset();
        lastPos = roundPosition({
            x: (e.clientX - offset.x) / totalMag(),
            y: (e.clientY - offset.y) / totalMag()
        });
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

        if (!lastPos) return;
        if (!shouldDraw()) return;

        const pen = currentPen();
        if (pen.name === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.strokeStyle = "rgba(0,0,0,1)";
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = pen.color;
        }

        ctx.lineWidth = pen.size;
        ctx.lineCap = "square";

        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(mouseLayerPos.x, mouseLayerPos.y);
        ctx.stroke();

        lastPos = mouseLayerPos;
    }

    function handlePointerUp() {
        lastPos = null;
    }

    onMount(() => {
        ctx = canvasRef?.getContext("2d") ?? null;

        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
    });

    onCleanup(() => {
        window.removeEventListener("pointerdown", handlePointerDown);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
    });

    const internalWidth = () => canvasStore.canvas.width / props.layer.dotMagnification;
    const internalHeight = () => canvasStore.canvas.height / props.layer.dotMagnification;

    const styleWidth = () => internalWidth() * totalMag();
    const styleHeight = () => internalHeight() * totalMag();

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

function roundPosition(position: { x: number, y: number }): { x: number, y: number } {
    return {
        x: Math.round(position.x),
        y: Math.round(position.y)
    }
}