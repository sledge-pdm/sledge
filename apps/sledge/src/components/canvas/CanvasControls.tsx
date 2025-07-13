import * as styles from '@styles/components/canvas/canvas_controls.css';
import { Component, createEffect, createSignal, onMount } from 'solid-js';
import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { canRedo, canUndo } from '~/controllers/layer/LayerController';

import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
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
        id='ignore-draw'
        class={styles.undoRedo}
        style={{
          opacity: activeCanUndo() ? '1.0' : '0.3',
          cursor: activeCanUndo() ? 'pointer' : 'unset',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          getAgentOf(layerListStore.activeLayerId)?.undo();
        }}
      >
        <Icon id='ignore-draw' src={'/icons/misc/undo.png'} base={24} color={vars.color.onBackground} />
      </div>
      <div
        id='ignore-draw'
        class={styles.undoRedo}
        style={{
          opacity: activeCanRedo() ? '1.0' : '0.3',
          cursor: activeCanRedo() ? 'pointer' : 'unset',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          getAgentOf(layerListStore.activeLayerId)?.redo();
        }}
      >
        <Icon id='ignore-draw' src='/icons/misc/redo.png' base={24} color={vars.color.onBackground} />
      </div>
    </div>
  );
};

export default CanvasControls;
