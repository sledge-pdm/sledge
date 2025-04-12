import { Component, onMount, createEffect, Ref, createRenderEffect } from "solid-js";
import { activeImage, canvasStore, imageStore, layerStore } from "~/stores/Store";
import styles from "./layer_canvas.module.css";
import { Layer } from "~/models/types/Layer";
import { cloneImageData } from "~/models/factories/utils";
import { runDSL } from "~/dsl/DSLRunner";
import { downloadImageData } from "~/utils/export";

type Props = {
    ref?: LayerCanvasRef,
    layer: Layer;
    zoom: number;
    zIndex: number;
};

export type LayerCanvasRef = {
    initDrawingBuffer: () => void;
    getDrawingBuffer: () => ImageData | undefined;
    resetDrawingBuffer: () => void;
    setImageData: (imageData: ImageData) => void;
};

export const LayerCanvas: Component<Props> = (props) => {
    let canvasRef: HTMLCanvasElement | undefined;
    let ctx: CanvasRenderingContext2D | null = null;
    let drawingBuffer: ImageData | undefined;

    createRefContent(
        () => props.ref,
        () => ({
            initDrawingBuffer() {
                drawingBuffer = cloneImageData(activeImage().current);
            },
            getDrawingBuffer() {
                return drawingBuffer;
            },
            resetDrawingBuffer() {
                drawingBuffer = undefined;
            },
            setImageData(imageData) {
                drawingBuffer = imageData;
                if (ctx && imageData) {
                    ctx.putImageData(imageData, 0, 0);
                }

            },
        }),
    );

    const totalMag = () => props.layer.dotMagnification * props.zoom;

    const internalWidth = () => canvasStore.canvas.width / props.layer.dotMagnification;
    const internalHeight = () => canvasStore.canvas.height / props.layer.dotMagnification;

    const styleWidth = () => internalWidth() * totalMag();
    const styleHeight = () => internalHeight() * totalMag();

    const testCurrentDSLTime = () => {
        const imageData = imageStore[props.layer.id].current;

        const start = new Date().getTime();
        console.log(`DSL run started.\n${props.layer.dsl.build()}`)
        runDSL(props.layer.dsl, imageData).then((im) => {
            const end = new Date().getTime();
            console.log(`DSL run end.`);
            console.log(`result: ${im ? "success" : "failed"}. TOTAL TIME IS ${end - start}ms.`)
            if (im) downloadImageData(im, "test-" + end + ".png")
        })
    }

    onMount(() => {
        ctx = canvasRef?.getContext("2d") ?? null;
    })

    createEffect(() => {
        const current = imageStore[props.layer.id]?.current;
        if (ctx && current) {
            ctx.putImageData(current, 0, 0);
        }
    });

    return (<>
        <canvas
            ref={canvasRef}
            id={`canvas-${props.layer.id}`}
            data-layer-id={props.layer.name}
            classList={{
                [styles["layer-canvas"]]: true,
                [styles["hidden"]]: !props.layer.enabled,
            }}
            width={internalWidth()}
            height={internalHeight()}
            style={{
                width: `${styleWidth()}px`,
                height: `${styleHeight()}px`,
                "z-index": props.zIndex,
            }} />
        {props.layer.id === layerStore.activeLayerId && <button onClick={testCurrentDSLTime}>test dsl</button>}
    </>
    );
};


function createRefContent<T extends Exclude<unknown, Function>>(
    getRef: () => Ref<T>,
    createRef: () => T,
) {
    createRenderEffect(() => {
        const refProp = getRef();
        if (typeof refProp !== "function") {
            throw new Error(
                "Should never happen, as solid always passes refs as functions",
            );
        }

        let refFunc = refProp as (value: T) => void;

        refFunc(createRef());
    });
}