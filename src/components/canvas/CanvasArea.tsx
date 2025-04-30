import { createMemo, onCleanup, onMount } from 'solid-js';
import CanvasAreaInteract from '../../controllers/canvas/CanvasAreaInteract';
import CanvasControls from './CanvasControls';
import CanvasStack from './stacks/CanvasStack';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { canvasArea } from '~/styles/components/canvas/canvas_area.css';
import BottomInfo from '../global/BottomInfo';
import CanvasDebugOverlay from './CanvasDebugOverlay';

export default () => {
  let wrapper: HTMLDivElement;
  let canvasStack: HTMLDivElement;

  const interact: CanvasAreaInteract = new CanvasAreaInteract();

  onMount(() => {
    setInteractStore('canvasAreaSize', {
      width: wrapper.clientWidth,
      height: wrapper.clientHeight,
    });
    interact.setInteractListeners(wrapper, canvasStack);

    getCurrentWindow().onResized(() => {
      setInteractStore('canvasAreaSize', {
        width: wrapper.clientWidth,
        height: wrapper.clientHeight,
      });
      interact.setInteractListeners(wrapper, canvasStack);
    });

    onCleanup(() => {
      if (interact !== undefined) {
        interact.removeInteractListeners(wrapper, canvasStack);
      }
    });
  });

  const offsetX = () => interactStore.offsetOrigin.x + interactStore.offset.x;
  const offsetY = () => interactStore.offsetOrigin.y + interactStore.offset.y;

  const transform = createMemo(() => {
    return `translate(${offsetX()}px, ${offsetY()}px) scale(${interactStore.zoom})`;
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
          padding: 0,
          margin: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
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
            transform: transform(),
          }}
        >
          <CanvasStack />
        </div>
      </div>

      <CanvasDebugOverlay />
      <CanvasControls />
      <BottomInfo />
    </div>
  );
};
