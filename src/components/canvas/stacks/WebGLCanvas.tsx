import { trackDeep } from '@solid-primitives/deep';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Component, createEffect, createSignal, onCleanup } from 'solid-js';
import { layerAgentManager } from '~/controllers/layer/LayerAgentManager';
import { allLayers } from '~/controllers/layer_list/LayerListController';
import { WebGLRenderer } from '~/controllers/webgl/WebGLRenderer';
import { RenderMode } from '~/models/layer/RenderMode';
import { setLogStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { layerCanvas } from '~/styles/components/canvas/layer_canvas.css';
import { listenEvent } from '~/utils/TauriUtils';

const WebGLCanvas: Component = () => {
  let canvasEl!: HTMLCanvasElement;
  let renderer: WebGLRenderer | undefined;

  const [updateRender, setUpdateRender] = createSignal(false);
  const [fps, setFps] = createSignal(60); // will replace this 60 by config store!

  // render loop (update if updateRender flag is true)
  const [isRenderLoopRunning, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS((timeStamp) => {
      if (updateRender()) {
        renderer?.render(allLayers());
        setUpdateRender(false);
      }
    }, fps)
  );

  listenEvent('onSetup', () => {
    const { width, height } = canvasStore.canvas;

    setLogStore('currentRenderMode', RenderMode.WebGL);
    startRenderLoop();
    renderer = new WebGLRenderer(canvasEl);
    renderer.resize(width, height);
    setUpdateRender(true);

    layerAgentManager.removeOnAnyImageChangeListener('webgl_canvas');
    layerAgentManager.setOnAnyImageChangeListener('webgl_canvas', () => {
      setUpdateRender(true);
    });
  });

  createEffect(() => {
    const { width, height } = canvasStore.canvas;
    renderer?.resize(width, height);
  });

  createEffect(() => {
    trackDeep(allLayers());
    setUpdateRender(true);
  });

  onCleanup(() => {
    if (!import.meta.hot) {
      stopRenderLoop();
      layerAgentManager.removeOnAnyImageChangeListener('webgl_canvas');
    }
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

export default WebGLCanvas;
