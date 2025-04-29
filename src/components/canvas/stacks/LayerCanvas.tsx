import { Component, createRenderEffect, onMount, Ref } from 'solid-js';
import LayerImageAgent from '~/models/layer_image/LayerImageAgent';

import { LayerImageManager } from '~/models/layer_image/LayerImageManager';
import { layerImageManager } from '~/routes/editor';
import { canvasStore } from '~/stores/ProjectStores';
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
  const internalWidth = () => canvasStore.canvas.width / props.layer.dotMagnification;
  const internalHeight = () => canvasStore.canvas.height / props.layer.dotMagnification;

  onMount(() => {
    let agent = layerImageManager.getAgent(props.layer.id);
    const ctx = canvasRef?.getContext('2d');

    if (ctx) agent?.putImageIntoForce(ctx);

    agent?.setOnImageChangeListener('layercanvas_refresh_' + props.layer.id, () => {
      if (ctx) agent.putImageIntoForce(ctx);
    });
    agent?.setOnDrawingBufferChangeListener('layercanvas_refresh_' + props.layer.id, () => {
      if (ctx) agent.putDrawingBufferIntoForce(ctx);
    });
  });

  return (
    <canvas
      ref={(el) => {
        canvasRef = el;
      }}
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

function createRefContent<T extends Exclude<unknown, Function>>(getRef: () => Ref<T>, createRef: () => T) {
  createRenderEffect(() => {
    const refProp = getRef();
    if (typeof refProp !== 'function') {
      throw new Error('Should never happen, as solid always passes refs as functions');
    }

    const refFunc = refProp as (value: T) => void;

    refFunc(createRef());
  });
}
