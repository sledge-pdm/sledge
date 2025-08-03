import { Component, onCleanup } from 'solid-js';
import CanvasAreaInteract from '../../controllers/canvas/CanvasAreaInteract';
import CanvasControls from './CanvasControls';
import WebGLCanvas from './stacks/CanvasStack';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { adjustZoomToFit, centeringCanvas } from '~/controllers/canvas/CanvasController';
import { setInteractStore } from '~/stores/EditorStores';
import { canvasArea } from '~/styles/components/canvas/canvas_area.css';
import { eventBus } from '~/utils/EventBus';
import { listenEvent } from '~/utils/TauriUtils';
import CanvasDebugOverlay from './CanvasDebugOverlay';

import { flexRow } from '@sledge/core';
import CanvasAreaOverlay from '~/components/canvas/CanvasAreaOverlay';
import { OuterSelectionMenu } from '~/components/canvas/overlays/SelectionMenu';
import SideSectionsOverlay from '~/components/canvas/SideSectionOverlay';
import BottomInfo from '~/components/global/BottomInfo';
import { globalConfig } from '~/stores/GlobalStores';

const CanvasArea: Component = () => {
  let wrapper: HTMLDivElement;
  let canvasStack: HTMLDivElement;

  let interact: CanvasAreaInteract | undefined = undefined;

  listenEvent('onSetup', () => {
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
        id='zoompan-wrapper'
        ref={(el) => {
          wrapper = el;
        }}
        style={{
          display: 'flex',
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          // 'z-index': 0,
          // 'background-color': '#00000030',
          'touch-action': 'none',
        }}
      >
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
          overflow: 'hidden',
          'pointer-events': 'none',
        }}
      >
        <SideSectionsOverlay side='leftSide' />
        {/* content between side sections */}
        <div id='sections-between-area' class={flexRow} style={{ 'flex-grow': 1, position: 'relative', 'pointer-events': 'none' }}>
          <CanvasControls />
          <OuterSelectionMenu />
          <CanvasDebugOverlay />
          <BottomInfo />
        </div>
        <SideSectionsOverlay side='rightSide' />
      </div>
    </div>
  );
};

export default CanvasArea;
