import { Component, onMount, Show } from 'solid-js';
import CanvasAreaInteract from './CanvasAreaInteract';
import CanvasControls from './overlays/CanvasControls';
import CanvasStack from './stacks/CanvasStack';

import { css } from '@acab/ecsstatic';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { adjustZoomToFit, centeringCanvas } from '~/features/canvas';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { eventBus } from '~/utils/EventBus';
import CanvasDebugOverlay from './overlays/CanvasDebugOverlay';

import createRAF, { targetFPS } from '@solid-primitives/raf';
import CanvasError from '~/components/canvas/overlays/CanvasError';
import CursorOverlay from '~/components/canvas/overlays/CursorOverlay';
import CanvasResizeFrame from '~/components/canvas/overlays/resize_frame/CanvasResizeFrame';
import { OnCanvasSelectionMenu, OuterSelectionMenu } from '~/components/canvas/overlays/SelectionMenu';
import CanvasOverlaySVG from '~/components/canvas/stacks/CanvasOverlaySVG';
import BottomInfo from '~/components/global/BottomInfo';
import SideSectionsOverlay from '~/components/section/SideSectionOverlay';
import { globalConfig } from '~/stores/GlobalStores';

const canvasArea = css`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
`;

const sectionsContainer = css`
  display: flex;
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
`;

const sectionsBetweenAreaContainer = css`
  display: flex;
  flex-direction: column;
  position: relative;
  flex-grow: 1;
  width: 0;
  pointer-events: none;
`;

const sectionsBetweenArea = css`
  display: flex;
  flex-direction: row;
  inset: 0;
  box-sizing: content-box;
  flex-grow: 1;
  position: relative;
  pointer-events: none;
`;

const canvasAreaWrapper = css`
  display: flex;
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: none;
  z-index: var(--zindex-zoom-pan-wrapper);
`;

const outCanvasArea = css`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`;

const canvasStackWrapper = css`
  width: fit-content;
  height: fit-content;
  padding: 0;
  margin: 0;
  transform-origin: 0 0;
`;

const canvasOverlayRoot = css`
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
  z-index: var(--zindex-canvas-overlay);
`;

const centerMarker = css`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0px;
  height: 0px;
  background-color: red;
`;

const CanvasArea: Component = () => {
  let wrapper: HTMLDivElement;
  let canvasStack: HTMLDivElement;

  let interact: CanvasAreaInteract | undefined = undefined;

  let lastTransformValues = {
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
  };

  const [isTransformUpdateRunning, startTransformUpdate, stopTransformUpdate] = createRAF(
    targetFPS(() => {
      updateTransform();
    }, 60)
  );

  const updateTransform = () => {
    const currentOffsetX = interactStore.offsetOrigin.x + interactStore.offset.x;
    const currentOffsetY = interactStore.offsetOrigin.y + interactStore.offset.y;
    const currentZoom = interactStore.zoom;

    // 差分検出による最適化
    if (
      lastTransformValues.offsetX !== currentOffsetX ||
      lastTransformValues.offsetY !== currentOffsetY ||
      lastTransformValues.zoom !== currentZoom
    ) {
      canvasStack.style.transform = `translate(${currentOffsetX}px, ${currentOffsetY}px) scale(${currentZoom})`;
      lastTransformValues = {
        offsetX: currentOffsetX,
        offsetY: currentOffsetY,
        zoom: currentZoom,
      };
    }
  };

  onMount(() => {
    const unlistenOnResized = getCurrentWindow().onResized(async (e) => {
      setInteractStore('canvasAreaSize', {
        width: wrapper.clientWidth,
        height: wrapper.clientHeight,
      });

      const isMaximize = await getCurrentWindow().isMaximized();
      const flag = isMaximize ? globalConfig.editor.centerCanvasOnMaximize : globalConfig.editor.centerCanvasOnResize;
      if (flag === 'offset') {
        centeringCanvas();
      }
      if (flag === 'offset_zoom') {
        adjustZoomToFit();
      }
    });
    eventBus.on('window:sideSectionSideChanged', (e) => {
      setInteractStore('canvasAreaSize', {
        width: wrapper.clientWidth,
        height: wrapper.clientHeight,
      });
      if (globalConfig.editor.centerCanvasOnResize === 'offset') {
        centeringCanvas();
      }
      if (globalConfig.editor.centerCanvasOnResize === 'offset_zoom') {
        adjustZoomToFit();
      }
    });

    setInteractStore('canvasAreaSize', {
      width: wrapper.clientWidth,
      height: wrapper.clientHeight,
    });
    adjustZoomToFit();

    interact = new CanvasAreaInteract(canvasStack, wrapper);
    interact.setInteractListeners();

    updateTransform();
    startTransformUpdate();

    return () => {
      unlistenOnResized.then((callback) => callback());
      interact?.removeInteractListeners();
      stopTransformUpdate();
    };
  });

  return (
    <div class={canvasArea}>
      <div
        id='canvas-area'
        ref={(el) => {
          wrapper = el;
        }}
        class={canvasAreaWrapper}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
        }}
      >
        <div id='out-canvas-area' class={outCanvasArea} />

        <div ref={(el) => (canvasStack = el)} class={canvasStackWrapper}>
          <CanvasStack />
        </div>

        {/* オーバーレイ (ズーム外) のための固定ルート */}
        <div id='canvas-overlay-root' class={canvasOverlayRoot}>
          <Show when={interactStore.isCanvasSizeFrameMode}>
            <CanvasResizeFrame />
          </Show>
          {/* SelectionMenu / SVG Overlay をズーム外で描画 */}
          <CanvasOverlaySVG />
          <OnCanvasSelectionMenu />
        </div>
        <CursorOverlay />
      </div>
      <div class={sectionsContainer}>
        <SideSectionsOverlay side='leftSide' />
        {/* content between side sections */}
        <div class={sectionsBetweenAreaContainer}>
          <div id='sections-between-area' class={sectionsBetweenArea}>
            <div id='between-area-center' class={centerMarker} />

            <CanvasControls />
            <OuterSelectionMenu />
            <CanvasDebugOverlay />
            <CanvasError />
          </div>
          <BottomInfo />
        </div>
        <SideSectionsOverlay side='rightSide' />
      </div>
    </div>
  );
};

export default CanvasArea;
