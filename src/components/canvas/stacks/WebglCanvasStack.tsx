import { Component, createEffect, onCleanup, onMount } from 'solid-js';
import { WebGLCanvasController } from '~/controllers/webgl/WebGLCanvasController';
import { allLayers } from '~/controllers/layer_list/LayerListController';
import { canvasStore } from '~/stores/ProjectStores';
import { layerCanvas } from '~/styles/components/canvas/layer_canvas.css';
import { setLogStore } from '~/stores/EditorStores';
import { RenderMode } from '~/types/RenderMode';

const WebglCanvasStack: Component = () => {
  let canvasEl!: HTMLCanvasElement;
  let renderer: WebGLCanvasController;

  onMount(() => {
    setLogStore('currentRenderMode', RenderMode.WebGL);
    renderer = new WebGLCanvasController(canvasEl, /*MAX_LAYERS*/ 16);
    renderer.init(allLayers());
    import.meta.hot?.on('vite:afterUpdate', () => {
      renderer.init(allLayers());
    });
  });

  createEffect(() => {
    const { width, height } = canvasStore.canvas;
    renderer.resize(width, height);
  });

  createEffect(() => {
    renderer.updateLayers(allLayers().toReversed());
  });

  onCleanup(() => {
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

export default WebglCanvasStack;
