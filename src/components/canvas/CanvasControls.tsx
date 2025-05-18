import * as styles from '@styles/components/canvas/canvas_controls.css';
import { Component } from 'solid-js';
import { getAgentOf } from '~/controllers/canvas/layer/LayerAgentManager';
import { canRedo, canUndo } from '~/controllers/canvas/layer/LayerController';

import { layerListStore } from '~/stores/ProjectStores';

const CanvasControls: Component = () => {
  return (
    <div class={styles.topRightNav}>
      <img
        class={styles.undoRedo}
        src='/icons/misc/undo.png'
        style={{
          opacity: canUndo() ? '1.0' : '0.3',
          cursor: canUndo() ? 'pointer' : 'unset',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          getAgentOf(layerListStore.activeLayerId)?.undo();
        }}
      />
      <img
        class={styles.undoRedo}
        src='/icons/misc/redo.png'
        style={{
          opacity: canRedo() ? '1.0' : '0.3',
          cursor: canRedo() ? 'pointer' : 'unset',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          getAgentOf(layerListStore.activeLayerId)?.redo();
        }}
      />
    </div>
  );
};

export default CanvasControls;
