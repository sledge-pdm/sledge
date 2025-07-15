import * as styles from '@styles/components/canvas/canvas_controls.css';
import { Component, createEffect, createSignal, onMount } from 'solid-js';
import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
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
    <div class={styles.topRightNav}>
      <div
        class={styles.undoRedoContainer}
        style={{
          cursor: activeCanUndo() ? 'pointer' : 'unset',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          getAgentOf(layerListStore.activeLayerId)?.undo();
        }}
      >
        <div
          class={styles.undoIcon}
          style={{
            opacity: activeCanUndo() ? '1.0' : '0.3',
          }}
        />
      </div>
      <div
        class={styles.undoRedoContainer}
        style={{
          cursor: activeCanRedo() ? 'pointer' : 'unset',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          getAgentOf(layerListStore.activeLayerId)?.redo();
        }}
      >
        <div
          class={styles.redoIcon}
          style={{
            opacity: activeCanRedo() ? '1.0' : '0.3',
          }}
        />
      </div>
    </div>
  );
};

export default CanvasControls;
