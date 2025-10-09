import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Component, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { allLayers } from '~/features/layer';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore, layerListStore } from '~/stores/ProjectStores';
import { eventBus, Events } from '~/utils/EventBus';
import { listenEvent } from '~/utils/TauriUtils';
import { WebGLRenderer } from '~/webgl/WebGLRenderer';

export let webGLRenderer: WebGLRenderer | undefined;

const WebGLCanvas: Component = () => {
  let canvasEl!: HTMLCanvasElement;

  const [updateRender, setUpdateRender] = createSignal(false);
  const [onlyDirtyUpdate, setOnlyDirtyUpdate] = createSignal(false);

  const [isRunning, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS((timeStamp) => {
      if (updateRender()) {
        setUpdateRender(false);
        try {
          webGLRenderer?.render(onlyDirtyUpdate());
        } catch (error) {
          console.error('WebGLCanvas: Failed to resize WebGLRenderer', error);
        }
        setOnlyDirtyUpdate(false);
      }
    }, Number(globalConfig.performance.targetFPS))
  );

  const handleCanvasSizeChangedEvent = (e: Events['canvas:sizeChanged']) => {
    const { width, height } = e.newSize;
    try {
      webGLRenderer?.resize(width, height);
    } catch (error) {
      console.error('WebGLCanvas: Failed to resize WebGLRenderer', error);
    }
    console.log('[WebGLCanvas] Canvas size changed:', width, height);
    setUpdateRender(true);
    setOnlyDirtyUpdate(true);
  };

  const handleUpdateReqEvent = (e: Events['webgl:requestUpdate']) => {
    /* console.log('[WebGLCanvas] Requesting update:', e.context); */
    setUpdateRender(true);
    setOnlyDirtyUpdate(e.onlyDirty);
  };

  const handleResumeRequest = (e: Events['webgl:requestResume']) => {
    if (!isRunning()) {
      init();
    }
  };

  const init = () => {
    if (webGLRenderer) {
      webGLRenderer.dispose();
      webGLRenderer = undefined;
    }

    const { width, height } = canvasStore.canvas;
    try {
      webGLRenderer = new WebGLRenderer(canvasEl);
      webGLRenderer?.setLayers(allLayers());
      webGLRenderer.resize(width, height);
      setOnlyDirtyUpdate(false);
      setUpdateRender(true); // rise flag for init render

      startRenderLoop();
      console.log('WebGLCanvas: Starting render loop');
    } catch (error) {
      console.error('WebGLCanvas: Failed to initialize WebGLRenderer', error);
      webGLRenderer = undefined;
    }
  };

  listenEvent('onSetup', () => {
    init();
  });

  createEffect(() => {
    const layers = layerListStore.layers;
    webGLRenderer?.setLayers(layers);
  });

  createEffect(() => {
    if (!isRunning()) {
      eventBus.emit('webgl:renderPaused', {});
    }
  });

  onMount(() => {
    eventBus.on('canvas:sizeChanged', handleCanvasSizeChangedEvent);
    eventBus.on('webgl:requestUpdate', handleUpdateReqEvent);
    eventBus.on('webgl:requestResume', handleResumeRequest);
  });

  onCleanup(() => {
    if (import.meta.hot) return;
    webGLRenderer?.dispose();
    webGLRenderer = undefined;
    stopRenderLoop();
    eventBus.off('canvas:sizeChanged', handleCanvasSizeChangedEvent);
    eventBus.off('webgl:requestUpdate', handleUpdateReqEvent);
    eventBus.off('webgl:requestResume', handleResumeRequest);
  });

  const imageRendering = () => {
    if (globalConfig.performance.canvasRenderingMode === 'adaptive') {
      return interactStore.zoom > 1 ? 'pixelated' : 'auto';
    }
    return globalConfig.performance.canvasRenderingMode;
  };

  return (
    <>
      <canvas
        ref={(el) => (canvasEl = el!)}
        style={{
          position: 'absolute',
          'image-rendering': imageRendering(),
          'z-index': 'var(--zindex-webgl-canvas)',
        }}
      />
    </>
  );
};

export default WebGLCanvas;
