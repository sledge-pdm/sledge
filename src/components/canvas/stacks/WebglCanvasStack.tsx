import { Component, createEffect, onCleanup, onMount } from 'solid-js';
import { allLayers } from '~/controllers/layer_list/LayerListController';
import { RenderMode } from '~/models/layer/RenderMode';
import { getWebglRenderer, initWebglRenderer } from '~/models/webgl/WebGLRenderer';
import { setLogStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { layerCanvas } from '~/styles/components/canvas/layer_canvas.css';

const WebGLCanvasStack: Component = () => {
  let canvasEl!: HTMLCanvasElement;

  onMount(() => {
    setLogStore('currentRenderMode', RenderMode.WebGL);
    initWebglRenderer(canvasEl, /*MAX_LAYERS*/ 16);
  });
  createEffect(() => {
    const { width, height } = canvasStore.canvas;
    const renderer = getWebglRenderer();
    renderer.resize(width, height);
  });
  createEffect(() => {
    const renderer = getWebglRenderer();
    renderer.updateLayers(allLayers().toReversed());
  });

  onCleanup(() => {
    const renderer = getWebglRenderer();
    renderer.destroy(/* skipOnHotReload */ true);
  });

  return (
    <canvas
      ref={(el) => (canvasEl = el!)}
      class={layerCanvas}
      style={{
        position: 'absolute',
        'image-rendering': 'pixelated',
      }}
    />
  );
};

export default WebGLCanvasStack;
