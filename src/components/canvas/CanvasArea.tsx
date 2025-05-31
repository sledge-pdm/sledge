import { onCleanup } from 'solid-js';
import CanvasAreaInteract from '../../controllers/canvas/CanvasAreaInteract';
import CanvasControls from './CanvasControls';
import WebGLCanvas from './stacks/CanvasStack';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { adjustZoomToFit } from '~/controllers/canvas/CanvasController';
import { setInteractStore } from '~/stores/EditorStores';
import { canvasArea } from '~/styles/components/canvas/canvas_area.css';
import { vars } from '~/styles/global.css';
import { listenEvent } from '~/utils/TauriUtils';
import BottomInfo from '../global/BottomInfo';
import CanvasDebugOverlay from './CanvasDebugOverlay';

export default () => {
  let wrapper: HTMLDivElement;
  let canvasStack: HTMLDivElement;

  let interact: CanvasAreaInteract | undefined = undefined;

  listenEvent('onSetup', () => {
    setInteractStore('canvasAreaSize', {
      width: wrapper.clientWidth,
      height: wrapper.clientHeight,
    });

    getCurrentWindow().onResized(() => {
      setInteractStore('canvasAreaSize', {
        width: wrapper.clientWidth,
        height: wrapper.clientHeight,
      });
      interact?.setInteractListeners();
    });

    adjustZoomToFit();

    interact = new CanvasAreaInteract(canvasStack, wrapper);
    interact.setInteractListeners();
    interact.updateTransform();
  });

  onCleanup(() => {
    interact?.removeInteractListeners();
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
          bottom: '40px',
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
      </div>

      <CanvasDebugOverlay />
      <CanvasControls />
      <BottomInfo />
    </div>
  );
};
