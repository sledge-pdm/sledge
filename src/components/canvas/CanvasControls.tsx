import * as styles from '@styles/components/canvas/canvas_controls.css';
import { Component } from 'solid-js';
import { getAgentOf } from '~/controllers/canvas/layer/LayerAgentManager';
import { canUndo } from '~/controllers/canvas/layer/LayerController';

import { layerListStore } from '~/stores/ProjectStores';
import { vars } from '~/styles/global.css';
import Icon from '../common/Icon';

const CanvasControls: Component = () => {
  return (
    <div class={styles.topRightNav}>
      <Icon
        class={styles.undoRedo}
        src={'/icons/misc/undo.png'}
        base={12}
        color={vars.color.onBackground}
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
      <Icon
        class={styles.undoRedo}
        src='/icons/misc/redo.png'
        base={12}
        color={vars.color.onBackground}
        style={{
          opacity: canUndo() ? '1.0' : '0.3',
          cursor: canUndo() ? 'pointer' : 'unset',
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
