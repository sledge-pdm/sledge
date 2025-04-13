import {
  Component,
  createEffect,
  createRenderEffect,
  onMount,
  Ref,
} from "solid-js";
import { cloneImageData } from "~/models/factories/utils";
import { Layer } from "~/models/types/Layer";
import { canvasStore } from '~/stores/canvasStore';
import { activeImage, imageStore } from '~/stores/imageStore';

import styles from "@styles/components/canvas/layer_canvas.module.css";

type Props = {
  ref?: LayerCanvasRef;
  layer: Layer;
  zIndex: number;
};

export type LayerCanvasRef = {
  initDrawingBuffer: () => void;
  getDrawingBuffer: () => ImageData | undefined;
  resetDrawingBuffer: () => void;
  setImageData: (imageData: ImageData) => void;
  update: () => void;
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
      update() {
        const imageData = imageStore[props.layer.id].current;
        this.setImageData(imageData);
      }
    }),
  );

  const styleWidth = () => canvasStore.canvas.width;
  const styleHeight = () => canvasStore.canvas.height;
  const internalWidth = () =>
    canvasStore.canvas.width / props.layer.dotMagnification;
  const internalHeight = () =>
    canvasStore.canvas.height / props.layer.dotMagnification;

  onMount(() => {
    ctx = canvasRef?.getContext("2d") ?? null;
  });

  createEffect(() => {
    const current = imageStore[props.layer.id]?.current;
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
