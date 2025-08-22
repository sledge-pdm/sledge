import { Component, createEffect, createSignal, onMount } from 'solid-js';
import { redoLayer, undoLayer } from '~/controllers/history/HistoryController';
import { canRedo, canUndo } from '~/controllers/layer/LayerController';
import { redoIcon, topRightNav, undoIcon, undoRedoContainer } from '~/styles/components/canvas/canvas_controls.css';

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
              d='M 2 5 L 3 5 L 3 4 L 1 4 L 1 3 L 0 3 L 0 2 L 1 2 L 1 1 L 3 1 L 3 0 L 2 0 L 2 2 L 7 2 L 7 8 L 1 8 L 1 7 L 8 7 L 8 3 L 2 3 L 2 5 Z'
              fill='black'
            />
          </clipPath>

          <clipPath id='clipPath-redo'>
            <path
              d='M 5 1 L 7 1 L 7 2 L 8 2 L 8 3 L 7 3 L 7 4 L 5 4 L 5 5 L 6 5 L 6 3 L 0 3 L 0 7 L 7 7 L 7 8 L 1 8 L 1 2 L 6 2 L 6 0 L 5 0 L 5 1 Z'
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
