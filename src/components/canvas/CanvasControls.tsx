import * as styles from '@styles/components/canvas/canvas_controls.css';
import { Component } from 'solid-js';
import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { canRedo, canUndo } from '~/controllers/layer/LayerController';

import { layerListStore } from '~/stores/ProjectStores';
import { vars } from '~/styles/global.css';
import Icon from '../common/Icon';

const CanvasControls: Component = () => {
  return (
    <div class={styles.topRightNav}>
      <div
        class={styles.undoRedo}
        style={{
          opacity: canUndo() ? '1.0' : '0.3',
          cursor: canUndo() ? 'pointer' : 'unset',
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
          opacity: canRedo() ? '1.0' : '0.3',
          cursor: canRedo() ? 'pointer' : 'unset',
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
