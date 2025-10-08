import { css } from '@acab/ecsstatic';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Component, createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { allLayers } from '~/features/layer';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore, layerListStore } from '~/stores/ProjectStores';
import { eventBus, Events } from '~/utils/EventBus';
import { listenEvent } from '~/utils/TauriUtils';
import { WebGLRenderer } from '~/webgl/WebGLRenderer';

const errorOverlayContent = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
`;

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
    // console.log('[WebGLCanvas] Requesting update:', e.context);
    setUpdateRender(true);
    setOnlyDirtyUpdate(e.onlyDirty);
  };

  const init = () => {
    if (webGLRenderer) {
      webGLRenderer.dispose();
      webGLRenderer = undefined;
    }

    const { width, height } = canvasStore.canvas;
    startRenderLoop();
    console.log('WebGLCanvas: Starting render loop');
    try {
      webGLRenderer = new WebGLRenderer(canvasEl);
      webGLRenderer?.setLayers(allLayers());
      webGLRenderer.resize(width, height);
      setUpdateRender(true); // rise flag for init render
      setOnlyDirtyUpdate(false);
    } catch (error) {
      console.error('WebGLCanvas: Failed to initialize WebGLRenderer', error);
      webGLRenderer = undefined;
    }

    eventBus.on('canvas:sizeChanged', handleCanvasSizeChangedEvent);
    eventBus.on('webgl:requestUpdate', handleUpdateReqEvent);
  };

  listenEvent('onSetup', () => {
    init();
  });

  createEffect(() => {
    const layers = layerListStore.layers;
    webGLRenderer?.setLayers(layers);
  });

  onCleanup(() => {
    if (import.meta.hot) return;
    webGLRenderer?.dispose();
    webGLRenderer = undefined;
    stopRenderLoop();
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
    <>
      <canvas
        ref={(el) => (canvasEl = el!)}
        style={{
          position: 'absolute',
          'image-rendering': imageRendering(),
          'z-index': 'var(--zindex-webgl-canvas)',
        }}
      />

      <Show when={!isRunning()}>
        <div
          style={{
            position: 'absolute',
            width: `${canvasStore.canvas.width}px`,
            height: `${canvasStore.canvas.height}px`,
            'background-color': '#00000050',
            'z-index': 'var(--zindex-canvas-error-overlay)',
          }}
        >
          <div
            class={errorOverlayContent}
            style={{
              width: `${canvasStore.canvas.width}px`,
              height: `${canvasStore.canvas.height}px`,
              // 'transform-origin': '0 0',
              transform: `scale(${2 / interactStore.zoom})`,
            }}
          >
            <p style={{ 'white-space': 'nowrap' }}>Render Paused.</p>
            <button onClick={init} style={{ 'white-space': 'nowrap' }}>
              RESTART
            </button>
          </div>
        </div>
      </Show>
    </>
  );
};

export default WebGLCanvas;
