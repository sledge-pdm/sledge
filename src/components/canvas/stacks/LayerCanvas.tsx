import {
  Component,
  createEffect,
  createRenderEffect,
  onMount,
  Ref,
} from 'solid-js';
import LayerImageAgent from '~/models/layer_image/LayerImageAgent';
import { layerImageManager } from './CanvasStack';

import { LayerImageManager } from '~/models/layer_image/LayerImageManager';
import { canvasStore } from '~/stores/project/canvasStore';
import { layerImageStore } from '~/stores/project/layerImageStore';
import { layerCanvas } from '~/styles/components/canvas/layer_canvas.css';
import { Layer } from '~/types/Layer';

type Props = {
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

  const agent = () => layerImageManager.getAgent(props.layer.id);

  createRefContent(
    () => props.ref,
    () => ({
      getLayer() {
        return props.layer;
      },
      getAgent() {
        return agent();
      },
    })
  );

  const styleWidth = () => canvasStore.canvas.width;
  const styleHeight = () => canvasStore.canvas.height;
  const internalWidth = () =>
    canvasStore.canvas.width / props.layer.dotMagnification;
  const internalHeight = () =>
    canvasStore.canvas.height / props.layer.dotMagnification;

  onMount(() => {
    let agent = layerImageManager.getAgent(props.layer.id);
    if (!agent) {
      agent = layerImageManager.registerAgent(
        props.layer.id,
        layerImageStore[props.layer.id]?.current
      );
    }
    ctx = canvasRef?.getContext('2d') ?? null;
    if (ctx) agent.putImageInto(ctx);

    agent.setOnImageChangeListener('layercanvas_refresh', () => {
      if (ctx) {
        agent.putImageIntoForce(ctx);
      }
    });
    agent.setOnDrawingBufferChangeListener('layercanvas_refresh', () => {
      if (ctx) {
        agent.putDrawingBufferIntoForce(ctx);
      }
    });
  });

  createEffect(() => {
    const image = layerImageStore[props.layer.id].current;
    agent()?.setImage(image, true);
    if (ctx) agent()?.putImageIntoForce(ctx);
  });

  return (
    <canvas
      ref={canvasRef}
      id={`canvas-${props.layer.id}`}
      data-layer-id={props.layer.name}
      class={layerCanvas}
      width={internalWidth()}
      height={internalHeight()}
      style={{
        position: 'absolute',
        width: `${styleWidth()}px`,
        height: `${styleHeight()}px`,
        'image-rendering': 'pixelated',
        'z-index': props.zIndex,
        opacity: props.layer.enabled ? 1 : 0,
      }}
    />
  );
};

function createRefContent<T extends Exclude<unknown, Function>>(
  getRef: () => Ref<T>,
  createRef: () => T
) {
  createRenderEffect(() => {
    const refProp = getRef();
    if (typeof refProp !== 'function') {
      throw new Error(
        'Should never happen, as solid always passes refs as functions'
      );
    }

    const refFunc = refProp as (value: T) => void;

    refFunc(createRef());
  });
}
