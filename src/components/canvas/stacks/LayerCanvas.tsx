import {
  Component,
  createEffect,
  createRenderEffect,
  onMount,
  Ref,
} from "solid-js";
import { cloneImageData } from "~/models/factories/utils";
import { Layer } from "~/models/types/Layer";
import { canvasStore } from "~/stores/project/canvasStore";
import { activeImage, imageStore } from "~/stores/project/imageStore";

import styles from "@styles/components/canvas/layer_canvas.module.css";
import { LayerImageManager } from "~/models/layer_image/LayerImageManager";
import LayerImageAgent from "~/models/layer_image/LayerImageAgent";

type Props = {
  manager: LayerImageManager,
  ref?: LayerCanvasRef;
  layer: Layer;
  zIndex: number;
};

export type LayerCanvasRef = {
  getLayer: () => Layer;
  getManager: () => LayerImageManager;
  getAgent: () => LayerImageAgent;
};

export const LayerCanvas: Component<Props> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let ctx: CanvasRenderingContext2D | null = null;

  const agent = () => props.manager.getAgent(props.layer.id);

  createRefContent(
    () => props.ref,
    () => ({
      getLayer() {
        return props.layer
      },
      getManager() {
        return props.manager
      },
      getAgent() {
        return agent()
      },
    }),
  );

  const styleWidth = () => canvasStore.canvas.width;
  const styleHeight = () => canvasStore.canvas.height;
  const internalWidth = () =>
    canvasStore.canvas.width / props.layer.dotMagnification;
  const internalHeight = () =>
    canvasStore.canvas.height / props.layer.dotMagnification;

  onMount(() => {
    const agent = props.manager.registerAgent(props.layer.id, imageStore[props.layer.id]?.current)
    ctx = canvasRef?.getContext("2d") ?? null;
    if (ctx) agent.putImageInto(ctx)

    agent.setOnImageChangeListener("layercanvas_refresh", () => {
      if (ctx) agent.putImageInto(ctx)
    })

    agent.setOnDrawingBufferChangeListener("layercanvas_refresh", () => {
      if (ctx) agent.putDrawingBufferInto(ctx)
    })
  });

  createEffect(() => {
    const canvas = canvasStore.canvas;
    canvas.width;
    canvas.height;

    agent()?.setImage(imageStore[props.layer.id]?.current)
    ctx = canvasRef?.getContext("2d") ?? null;
    if (ctx) agent()?.putImageInto(ctx)
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
