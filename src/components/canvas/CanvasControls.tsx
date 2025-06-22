import * as styles from '@styles/components/canvas/canvas_controls.css';
import { Component, createEffect, createSignal, onMount } from 'solid-js';
import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { canRedo, canUndo } from '~/controllers/layer/LayerController';

import { layerListStore } from '~/stores/ProjectStores';
import { vars } from '~/styles/global.css';
import { eventBus } from '~/utils/EventBus';
import Icon from '../common/Icon';

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
        class={styles.undoRedo}
        style={{
          opacity: activeCanUndo() ? '1.0' : '0.3',
          cursor: activeCanUndo() ? 'pointer' : 'unset',
        }}
        onClick={(e) => {
          getAgentOf(layerListStore.activeLayerId)?.undo();
        }}
      >
        <Icon src={'/icons/misc/undo.png'} base={24} color={vars.color.onBackground} />
      </div>
      <div
        class={styles.undoRedo}
        style={{
          opacity: activeCanRedo() ? '1.0' : '0.3',
          cursor: activeCanRedo() ? 'pointer' : 'unset',
        }}
        onClick={(e) => {
          getAgentOf(layerListStore.activeLayerId)?.redo();
        }}
      >
        <Icon src='/icons/misc/redo.png' base={24} color={vars.color.onBackground} />
      </div>
    </div>
  );
};

export default CanvasControls;
