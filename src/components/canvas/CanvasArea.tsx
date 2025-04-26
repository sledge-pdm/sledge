import { createMemo, onCleanup, onMount } from 'solid-js';
import CanvasAreaInteract from './CanvasAreaInteract';
import Controls from './Controls';
import CanvasStack from './stacks/CanvasStack';

import {
  adjustZoomToFit,
  canvasStore,
  centeringCanvas,
  setCanvasStore,
} from '~/stores/project/canvasStore';
import { canvasArea } from '~/styles/components/canvas/canvas_area.css';
import BottomInfo from '../BottomInfo';

export default () => {
  let wrapper: HTMLDivElement;
  let canvasStack: HTMLDivElement;

  const interact: CanvasAreaInteract = new CanvasAreaInteract();

  onMount(() => {
    // set Canvas to center
    setCanvasStore('canvasAreaSize', {
      width: wrapper.clientWidth,
      height: wrapper.clientHeight,
    });
    adjustZoomToFit();
    centeringCanvas();

    interact.setInteractListeners(wrapper, canvasStack);
  });

  onCleanup(() => {
    if (interact !== undefined) {
      interact.removeInteractListeners(wrapper, canvasStack);
    }
  });

  const offsetX = () => canvasStore.offsetOrigin.x + canvasStore.offset.x;
  const offsetY = () => canvasStore.offsetOrigin.y + canvasStore.offset.y;

  const transform = createMemo(() => {
    return `translate(${offsetX()}px, ${offsetY()}px) scale(${canvasStore.zoom})`;
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

      <Controls />
      <BottomInfo />
    </div>
  );
};
