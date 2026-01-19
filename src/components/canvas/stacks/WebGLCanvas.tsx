import { css } from '@acab/ecsstatic';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Component, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { allLayers } from '~/features/layer';
import { logSystemError, logSystemInfo } from '~/features/log/service';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { projectStore } from '~/stores/RuntimeProject';
import { eventBus, Events } from '~/utils/EventBus';
import { FrascoRenderer } from '~/webgl/FrascoRenderer';

const webglCanvasStyle = css`
  position: absolute;
  z-index: var(--zindex-webgl-canvas);
`;

export let webGLRenderer: FrascoRenderer | undefined;

const WebGLCanvas: Component = () => {
  const LOG_LABEL = 'WebGLCanvas';
  let canvasEl!: HTMLCanvasElement;

  const [updateRender, setUpdateRender] = createSignal(false);

  const [isRunning, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS((timeStamp) => {
      if (updateRender()) {
        setUpdateRender(false);
        try {
          webGLRenderer?.render();
        } catch (error) {
          logSystemError('Failed to render WebGL frame.', { label: LOG_LABEL, details: [error] });
        }
      }
    }, Number(globalConfig.performance.targetFPS))
  );

  let waitingForLayoutUpdate = false;

  const handleCanvasSizeChangedEvent = (e: Events['canvas:sizeChanged']) => {
    const { width, height } = e.newSize;
    waitingForLayoutUpdate = true;
    logSystemInfo('Queued layout-aware resize', {
      label: LOG_LABEL,
      details: [width, height],
      debugOnly: true,
    });
    setUpdateRender(false);
  };

  const handleCanvasLayoutReady = (e: Events['canvas:layoutReady']) => {
    if (!waitingForLayoutUpdate) return;
    waitingForLayoutUpdate = false;

    const { width, height } = e.newSize;
    try {
      webGLRenderer?.resize(width, height);
    } catch (error) {
      logSystemError('Failed to resize WebGLRenderer after layout update', { label: LOG_LABEL, details: [error] });
    }

    logSystemInfo('Layout-ready resize applied', {
      label: LOG_LABEL,
      details: [width, height],
      debugOnly: true,
    });
    setUpdateRender(true);
  };

  const handleUpdateReqEvent = (e: Events['webgl:requestUpdate']) => {
    /* console.log('[WebGLCanvas] Requesting update:', e.context); */
    setUpdateRender(true);
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

    const { width, height } = projectStore.canvas.size;
    try {
      webGLRenderer = new FrascoRenderer(canvasEl);
      webGLRenderer?.setLayers(allLayers());
      webGLRenderer.resize(width, height);
      setUpdateRender(true); // rise flag for init render

      startRenderLoop();

      logSystemInfo('Starting render loop', { label: LOG_LABEL, debugOnly: true });
    } catch (error) {
      logSystemError('Failed to initialize WebGLRenderer', { label: LOG_LABEL, details: [error] });
      webGLRenderer = undefined;
    }
  };

  onMount(() => {
    init();
  });

  createEffect(() => {
    const layers = projectStore.layers.layers;
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
