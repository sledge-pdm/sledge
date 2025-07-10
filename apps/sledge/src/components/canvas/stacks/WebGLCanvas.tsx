import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Component, createSignal, onCleanup } from 'solid-js';
import { allLayers } from '~/controllers/layer/LayerListController';
import { WebGLRenderer } from '~/controllers/webgl/WebGLRenderer';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore } from '~/stores/ProjectStores';
import { layerCanvas } from '~/styles/components/canvas/layer_canvas.css';
import { eventBus, Events } from '~/utils/EventBus';
import { listenEvent } from '~/utils/TauriUtils';

export let webGLRenderer: WebGLRenderer | undefined;

const WebGLCanvas: Component = () => {
  let canvasEl!: HTMLCanvasElement;

  const [updateRender, setUpdateRender] = createSignal(false);
  const [onlyDirtyUpdate, setOnlyDirtyUpdate] = createSignal(false);

  const [fps, setFps] = createSignal(60);
  const [isRunning, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS((timeStamp) => {
      if (updateRender()) {
        setUpdateRender(false);
        webGLRenderer?.render(allLayers(), onlyDirtyUpdate());
        setOnlyDirtyUpdate(false);
      }
    }, fps)
  );

  const handleCanvasSizeChangedEvent = (e: Events['canvas:sizeChanged']) => {
    const { width, height } = e.newSize;
    webGLRenderer?.resize(width, height);
    setUpdateRender(true);
    setOnlyDirtyUpdate(true);
  };

  const handleUpdateReqEvent = (e: Events['webgl:requestUpdate']) => {
    setUpdateRender(true);
    setOnlyDirtyUpdate(e.onlyDirty);
  };

  listenEvent('onSetup', () => {
    const { width, height } = canvasStore.canvas;

    startRenderLoop();
    webGLRenderer = new WebGLRenderer(canvasEl);
    webGLRenderer.resize(width, height);
    setUpdateRender(true); // rise flag for init render

    eventBus.on('canvas:sizeChanged', handleCanvasSizeChangedEvent);
    eventBus.on('webgl:requestUpdate', handleUpdateReqEvent);
  });

  onCleanup(() => {
    if (import.meta.hot) return;
    webGLRenderer?.dispose();
    webGLRenderer = undefined;
    stopRenderLoop();
    // layerAgentManager.removeOnAnyImageChangeListener('webgl_canvas');
    eventBus.off('canvas:sizeChanged', handleCanvasSizeChangedEvent);
    eventBus.off('webgl:requestUpdate', handleUpdateReqEvent);
  });

  const imageRendering = () => {
    if (globalConfig.performance.canvasRenderingMode === 'adaptive') {
      return interactStore.zoom > 1 ? 'pixelated' : 'auto';
    }
    return globalConfig.performance.canvasRenderingMode;
  };

  return (
    <canvas
      ref={(el) => (canvasEl = el!)}
      class={layerCanvas}
      style={{
        position: 'absolute',
        'image-rendering': imageRendering(),
      }}
    />
  );
};

export default WebGLCanvas;
