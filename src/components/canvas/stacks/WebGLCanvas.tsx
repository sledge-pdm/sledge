import { trackDeep } from '@solid-primitives/deep';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Component, createEffect, createSignal, onCleanup } from 'solid-js';
import { adjustZoomToFit } from '~/controllers/canvas/CanvasController';
import { layerAgentManager } from '~/controllers/layer/LayerAgentManager';
import { allLayers } from '~/controllers/layer/LayerListController';
import { WebGLRenderer } from '~/controllers/webgl/WebGLRenderer';
import { RenderMode } from '~/models/layer/RenderMode';
import { setLogStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { layerCanvas } from '~/styles/components/canvas/layer_canvas.css';
import { listenEvent } from '~/utils/TauriUtils';

export let webGLRenderer: WebGLRenderer | undefined;

const WebGLCanvas: Component = () => {
  let canvasEl!: HTMLCanvasElement;

  const [updateRender, setUpdateRender] = createSignal(false);
  const [fps, setFps] = createSignal(60);
  const [isRunning, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS((timeStamp) => {
      if (updateRender()) {
        webGLRenderer?.render(allLayers());
        setUpdateRender(false);
      }
    }, fps)
  );

  listenEvent('onSetup', () => {
    const { width, height } = canvasStore.canvas;

    setLogStore('currentRenderMode', RenderMode.WebGL);
    startRenderLoop();
    webGLRenderer = new WebGLRenderer(canvasEl);
    webGLRenderer.resize(width, height);
    setUpdateRender(true);

    layerAgentManager.removeOnAnyImageChangeListener('webgl_canvas');
    layerAgentManager.setOnAnyImageChangeListener('webgl_canvas', () => {
      setUpdateRender(true);
    });

    const window = getCurrentWindow();
    window.onResized(() => {
      adjustZoomToFit();
    });
  });

  createEffect(() => {
    const { width, height } = canvasStore.canvas;
    webGLRenderer?.resize(width, height);
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
