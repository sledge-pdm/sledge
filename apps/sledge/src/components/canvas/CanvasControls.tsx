import { redoIcon, topRightNav, undoIcon, undoRedoContainer } from '@styles/components/canvas/canvas_controls.css';
import { Component, createEffect, createSignal, onMount } from 'solid-js';
import { redoLayer, undoLayer } from '~/controllers/history/HistoryController';
import { canRedo, canUndo } from '~/controllers/layer/LayerController';

import { layerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';

const CanvasControls: Component = () => {
  const [activeCanUndo, setActiveCanUndo] = createSignal(canUndo());
  const [activeCanRedo, setActiveCanRedo] = createSignal(canRedo());

  onMount(() => {
    eventBus.on('layerHistory:changed', () => {
      setActiveCanUndo(canUndo());
      setActiveCanRedo(canRedo());
    });
  });

  createEffect(() => {
    layerListStore.activeLayerId;

    setActiveCanUndo(canUndo());
    setActiveCanRedo(canRedo());
  });

  return (
    <div class={topRightNav}>
      <svg width='0' height='0'>
        <defs>
          <clipPath id='clipPath-undo'>
            <path
              d='M 2 4 L 3 4 L 3 3 L 5 3 L 5 2 L 4 2 L 4 4 L 9 4 L 9 10 L 3 10 L 3 9 L 10 9 L 10 5 L 4 5 L 4 7 L 5 7 L 5 6 L 3 6 L 3 5 L 2 5 L 2 4 Z'
              fill='black'
            />
          </clipPath>

          <clipPath id='clipPath-redo'>
            <path
              d='M 7 7 L 8 7 L 8 5 L 2 5 L 2 9 L 9 9 L 9 10 L 3 10 L 3 4 L 8 4 L 8 2 L 7 2 L 7 3 L 9 3 L 9 4 L 10 4 L 10 5 L 9 5 L 9 6 L 7 6 L 7 7 Z'
              fill='black'
            />
          </clipPath>
        </defs>
      </svg>
      <div
        class={undoRedoContainer}
        style={{
          cursor: activeCanUndo() ? 'pointer' : 'unset',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          undoLayer(layerListStore.activeLayerId);
        }}
      >
        <div
          class={undoIcon}
          style={{
            'clip-path': 'url(#clipPath-undo)',
            opacity: activeCanUndo() ? '1.0' : '0.3',
          }}
        />
      </div>
      <div
        class={undoRedoContainer}
        style={{
          cursor: activeCanRedo() ? 'pointer' : 'unset',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          redoLayer(layerListStore.activeLayerId);
        }}
      >
        <div
          class={redoIcon}
          style={{
            'clip-path': 'url(#clipPath-redo)',
            opacity: activeCanRedo() ? '1.0' : '0.3',
          }}
        />
      </div>
    </div>
  );
};

export default CanvasControls;
