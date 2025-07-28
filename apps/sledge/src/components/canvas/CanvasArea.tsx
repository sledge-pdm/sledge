import { Component, onCleanup } from 'solid-js';
import CanvasAreaInteract from '../../controllers/canvas/CanvasAreaInteract';
import CanvasControls from './CanvasControls';
import WebGLCanvas from './stacks/CanvasStack';

import { vars } from '@sledge/theme';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { adjustZoomToFit, centeringCanvas } from '~/controllers/canvas/CanvasController';
import { setInteractStore } from '~/stores/EditorStores';
import { canvasArea } from '~/styles/components/canvas/canvas_area.css';
import { eventBus } from '~/utils/EventBus';
import { listenEvent } from '~/utils/TauriUtils';
import CanvasDebugOverlay from './CanvasDebugOverlay';

import CanvasAreaOverlay from '~/components/canvas/CanvasAreaOverlay';
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
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          // 'z-index': 10000,
          // 'background-color': '#00000030',
          'touch-action': 'none',
        }}
      >
        <div
          ref={(el) => (canvasStack = el)}
          style={{
            width: 'fit-content',
            height: 'fit-content',
            'background-color': vars.color.canvas,
            padding: 0,
            margin: 0,
            'transform-origin': '0 0',
          }}
        >
          <WebGLCanvas />
        </div>

        <CanvasAreaOverlay />

        <CanvasDebugOverlay />
      </div>

      <CanvasControls />
    </div>
  );
};

export default CanvasArea;
