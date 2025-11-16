import { css } from '@acab/ecsstatic';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Component, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { allLayers } from '~/features/layer';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore, layerListStore } from '~/stores/ProjectStores';
import { eventBus, Events } from '~/utils/EventBus';
import { WebGLRenderer } from '~/webgl/WebGLRenderer';

const webglCanvasStyle = css`
  position: absolute;
  z-index: var(--zindex-webgl-canvas);
`;

export let webGLRenderer: WebGLRenderer | undefined;

const WebGLCanvas: Component = () => {
  let canvasEl!: HTMLCanvasElement;
  let requireFullRender = false;

  const [updateRender, setUpdateRender] = createSignal(false);
  const [onlyDirtyUpdate, setOnlyDirtyUpdate] = createSignal(false);

  const [isRunning, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS((timeStamp) => {
      if (updateRender()) {
        setUpdateRender(false);
        try {
          webGLRenderer?.render(onlyDirtyUpdate());
          requireFullRender = false;
        } catch (error) {
          console.error('WebGLCanvas: Failed to resize WebGLRenderer', error);
        }
        setOnlyDirtyUpdate(false);
      }
    }, Number(globalConfig.performance.targetFPS))
  );

  let waitingForLayoutUpdate = false;

  const handleCanvasSizeChangedEvent = (e: Events['canvas:sizeChanged']) => {
    const { width, height } = e.newSize;
    waitingForLayoutUpdate = true;
    console.log('[WebGLCanvas] Queued layout-aware resize:', width, height);
    requireFullRender = true;
    setOnlyDirtyUpdate(false);
    setUpdateRender(false);
  };

  const handleCanvasLayoutReady = (e: Events['canvas:layoutReady']) => {
    if (!waitingForLayoutUpdate) return;
    waitingForLayoutUpdate = false;

    const { width, height } = e.newSize;
    try {
      webGLRenderer?.resize(width, height);
    } catch (error) {
      console.error('WebGLCanvas: Failed to resize WebGLRenderer after layout update', error);
    }
    console.log('[WebGLCanvas] Layout-ready resize applied:', width, height);
    requireFullRender = true;
    setOnlyDirtyUpdate(false);
    setUpdateRender(true);
  };

  const handleUpdateReqEvent = (e: Events['webgl:requestUpdate']) => {
    /* console.log('[WebGLCanvas] Requesting update:', e.context); */
    if (!e.onlyDirty) {
      requireFullRender = true;
    }
    setUpdateRender(true);
    setOnlyDirtyUpdate(!requireFullRender && e.onlyDirty);
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
      requireFullRender = true;
      setOnlyDirtyUpdate(false);
      setUpdateRender(true); // rise flag for init render

      startRenderLoop();
      console.log('WebGLCanvas: Starting render loop');
    } catch (error) {
      console.error('WebGLCanvas: Failed to initialize WebGLRenderer', error);
      webGLRenderer = undefined;
    }
  };

  onMount(() => {
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
    eventBus.on('canvas:layoutReady', handleCanvasLayoutReady);
    eventBus.on('webgl:requestUpdate', handleUpdateReqEvent);
    eventBus.on('webgl:requestResume', handleResumeRequest);
  });

  onCleanup(() => {
    webGLRenderer?.dispose();
    webGLRenderer = undefined;
    stopRenderLoop();
    eventBus.off('canvas:sizeChanged', handleCanvasSizeChangedEvent);
    eventBus.off('canvas:layoutReady', handleCanvasLayoutReady);
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
    <canvas
      ref={(el) => (canvasEl = el!)}
      class={webglCanvasStyle}
      style={{
        'image-rendering': imageRendering(),
      }}
    />
  );
};

export default WebGLCanvas;
