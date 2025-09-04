import { Component, onCleanup, onMount } from 'solid-js';
import CanvasAreaInteract from '../../controllers/canvas/CanvasAreaInteract';
import CanvasControls from './CanvasControls';
import WebGLCanvas from './stacks/CanvasStack';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { adjustZoomToFit, centeringCanvas } from '~/controllers/canvas/CanvasController';
import { setInteractStore } from '~/stores/EditorStores';
import { canvasArea } from '~/styles/components/canvas/canvas_area.css';
import { eventBus } from '~/utils/EventBus';
import CanvasDebugOverlay from './CanvasDebugOverlay';

import { flexCol, flexRow } from '@sledge/core';
import CanvasAreaOverlay from '~/components/canvas/CanvasAreaOverlay';
import { OuterSelectionMenu } from '~/components/canvas/overlays/SelectionMenu';
import SideSectionsOverlay from '~/components/canvas/SideSectionOverlay';
import BottomInfo from '~/components/global/BottomInfo';
import { Consts } from '~/models/Consts';
import { globalConfig } from '~/stores/GlobalStores';

const CanvasArea: Component = () => {
  let wrapper: HTMLDivElement;
  let canvasStack: HTMLDivElement;

  let interact: CanvasAreaInteract | undefined = undefined;

  onMount(() => {
    getCurrentWindow().onResized(() => {
      setInteractStore('canvasAreaSize', {
        width: wrapper.clientWidth,
        height: wrapper.clientHeight,
      });
      if (globalConfig.editor.centerCanvasWhenWindowResized) {
        centeringCanvas();
      }
    });
    eventBus.on('window:sideSectionSideChanged', (e) => {
      setInteractStore('canvasAreaSize', {
        width: wrapper.clientWidth,
        height: wrapper.clientHeight,
      });
      if (globalConfig.editor.centerCanvasWhenWindowResized) {
        centeringCanvas();
      }
    });

    setInteractStore('canvasAreaSize', {
      width: wrapper.clientWidth,
      height: wrapper.clientHeight,
    });
    adjustZoomToFit();

    eventBus.on('canvas:sizeChanged', (e) => {
      interact?.updateTransform();
    });

    eventBus.on('canvas:onAdjusted', (e) => {
      interact?.updateTransform();
    });

    interact = new CanvasAreaInteract(canvasStack, wrapper);
    interact.setInteractListeners();
    interact.updateTransform();
  });

  onCleanup(() => {
    if (!import.meta.hot) interact?.removeInteractListeners();
  });

  return (
    <div class={canvasArea}>
      <div
        id='canvas-area'
        ref={(el) => {
          wrapper = el;
        }}
        style={{
          display: 'flex',
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          'touch-action': 'none',
          'z-index': Consts.zIndex.zoomPanWrapper,
        }}
      >
        <div
          id='out-canvas-area'
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
          }}
        />

        <div
          ref={(el) => (canvasStack = el)}
          style={{
            width: 'fit-content',
            height: 'fit-content',
            padding: 0,
            margin: 0,
            'transform-origin': '0 0',
          }}
        >
          <WebGLCanvas />
        </div>

        <CanvasAreaOverlay />
      </div>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'visible',
          'pointer-events': 'none',
        }}
      >
        <SideSectionsOverlay side='leftSide' />
        {/* content between side sections */}
        <div class={flexCol} style={{ position: 'relative', 'flex-grow': 1, width: 0, 'pointer-events': 'none' }}>
          <div
            id='sections-between-area'
            class={flexRow}
            style={{
              inset: 0,
              'box-sizing': 'content-box',
              'flex-grow': 1,
              position: 'relative',
              'pointer-events': 'none',
            }}
          >
            <CanvasControls />
            <OuterSelectionMenu />
            <CanvasDebugOverlay />
          </div>
          <BottomInfo />
        </div>
        <SideSectionsOverlay side='rightSide' />
      </div>
    </div>
  );
};

export default CanvasArea;
