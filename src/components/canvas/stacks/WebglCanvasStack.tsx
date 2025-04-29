import { Component, createEffect, onCleanup, onMount } from 'solid-js';
import { WebGLCanvasController } from '~/controllers/webgl/WebGLCanvasController';
import { allLayers } from '~/controllers/layer_list/LayerListController';
import { canvasStore } from '~/stores/ProjectStores';
import { layerCanvas } from '~/styles/components/canvas/layer_canvas.css';
import { setLogStore } from '~/stores/EditorStores';
import { RenderMode } from '~/types/RenderMode';
import { getWebglRenderer, initWebglRenderer } from '~/models/webgl/WebGLRenderer';

const WebGLCanvasStack: Component = () => {
  let canvasEl!: HTMLCanvasElement;
  let renderer: WebGLCanvasController;

  onMount(() => {
    setLogStore('currentRenderMode', RenderMode.WebGL);
    initWebglRenderer(canvasEl, /*MAX_LAYERS*/ 16);

    import.meta.hot?.on('vite:afterUpdate', () => {
      initWebglRenderer(canvasEl, /*MAX_LAYERS*/ 16);
    });
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
