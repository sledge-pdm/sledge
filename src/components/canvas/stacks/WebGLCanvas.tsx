import { css } from '@acab/ecsstatic';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Component, createEffect, createSignal, onMount } from 'solid-js';
import { allLayers } from '~/features/layer';
import { logSystemError, logSystemInfo } from '~/features/log/service';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { eventBus, Events } from '~/utils/EventBus';

export const notifyCanvasLayoutReady = (size: { width: number; height: number }) => {
  eventBus.emit('canvas:layoutReady', { newSize: size });
};

import { FrascoRenderer } from '~/webgl/FrascoRenderer';

const webglCanvasStyle = css`
  position: absolute;
  z-index: var(--zindex-webgl-canvas);
`;

export let frascoRenderer: FrascoRenderer | undefined;

const WebGLCanvas: Component = () => {
  const LOG_LABEL = 'WebGLCanvas';
  let canvasEl!: HTMLCanvasElement;

  const [updateRender, setUpdateRender] = createSignal(false);

  const [isRunning, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS((timeStamp) => {
      if (updateRender()) {
        setUpdateRender(false);
        try {
          frascoRenderer?.render();
        } catch (error) {
          logSystemError('Failed to render WebGL frame.', { label: LOG_LABEL, details: [error] });
        }
      }
    }, Number(globalConfig.performance.targetFPS))
  );

  let waitingForLayoutUpdate = false;

  createEffect(() => {
    const { width, height } = projectStore.canvas.size;
    waitingForLayoutUpdate = true;
    logSystemInfo('Queued layout-aware resize', {
      label: LOG_LABEL,
      details: [width, height],
      debugOnly: true,
    });
    setUpdateRender(false);
  });

  const handleCanvasLayoutReady = (e: Events['canvas:layoutReady']) => {
    if (!waitingForLayoutUpdate) return;
    waitingForLayoutUpdate = false;

    const { width, height } = e.newSize;
    try {
      frascoRenderer?.resize(width, height);
    } catch (error) {
      logSystemError('Failed to resize frascoRenderer after layout update', { label: LOG_LABEL, details: [error] });
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
    if (frascoRenderer) {
      frascoRenderer.dispose();
      frascoRenderer = undefined;
    }

    const { width, height } = projectStore.canvas.size;
    try {
      frascoRenderer = new FrascoRenderer(canvasEl);
      frascoRenderer?.setLayers(allLayers());
      frascoRenderer.resize(width, height);
      setUpdateRender(true); // rise flag for init render

      startRenderLoop();

      logSystemInfo('Starting render loop', { label: LOG_LABEL, debugOnly: true });
    } catch (error) {
      logSystemError('Failed to initialize WebGLRenderer', { label: LOG_LABEL, details: [error] });
      frascoRenderer = undefined;
    }
  };

  onMount(() => {
    init();
    // eventBus.on('canvas:sizeChanged', handleCanvasSizeChangedEvent);
    eventBus.on('canvas:layoutReady', handleCanvasLayoutReady);
    eventBus.on('webgl:requestUpdate', handleUpdateReqEvent);
    eventBus.on('webgl:requestResume', handleResumeRequest);

    return () => {
      frascoRenderer?.dispose();
      frascoRenderer = undefined;
      stopRenderLoop();
      // eventBus.off('canvas:sizeChanged', handleCanvasSizeChangedEvent);
      eventBus.off('canvas:layoutReady', handleCanvasLayoutReady);
      eventBus.off('webgl:requestUpdate', handleUpdateReqEvent);
      eventBus.off('webgl:requestResume', handleResumeRequest);
    };
  });

  createEffect(() => {
    const layers = projectStore.layers.layers;
    frascoRenderer?.setLayers(layers);
  });

  createEffect(() => {
    if (!isRunning()) {
      eventBus.emit('webgl:renderPaused', {});
    }
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
