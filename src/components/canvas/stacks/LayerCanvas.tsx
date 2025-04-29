import { Component, createRenderEffect, onMount, Ref } from 'solid-js';
import { layerAgentManager } from '~/routes/editor';
import { setLogStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { layerCanvas } from '~/styles/components/canvas/layer_canvas.css';
import { Layer } from '~/types/Layer';
import { RenderMode } from '~/types/RenderMode';

type Props = {
  layer: Layer;
  zIndex: number;
};

export const LayerCanvas: Component<Props> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;

  const styleWidth = () => canvasStore.canvas.width;
  const styleHeight = () => canvasStore.canvas.height;
  const internalWidth = () => canvasStore.canvas.width / props.layer.dotMagnification;
  const internalHeight = () => canvasStore.canvas.height / props.layer.dotMagnification;

  onMount(() => {
    setLogStore('currentRenderMode', RenderMode.CanvasPerLayer);

    let agent = layerAgentManager.getAgent(props.layer.id);
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
