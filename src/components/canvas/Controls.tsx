import { Component } from 'solid-js';
import { layerImageManager } from './stacks/CanvasStack';
import styles from '@styles/components/canvas/controls.module.css';
import { canRedo, canUndo } from '~/stores/project/layerImageStore';
import { layerStore } from '~/stores/project/layerStore';

const Controls: Component = () => {
  return (
    <>
      <div class={styles['top-right-nav']}>
        <img
          class={styles.undo_redo}
          src='/undo.png'
          style={{
            opacity: canUndo() ? '1.0' : '0.3',
            cursor: canUndo() ? 'pointer' : 'unset',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            layerImageManager.getAgent(layerStore.activeLayerId)?.undo();
          }}
        />
        <img
          class={styles.undo_redo}
          src='/redo.png'
          style={{
            opacity: canRedo() ? '1.0' : '0.3',
            cursor: canRedo() ? 'pointer' : 'unset',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            layerImageManager.getAgent(layerStore.activeLayerId)?.redo();
          }}
        />

        {/* <DSLEditor /> */}
      </div>
    </>
  );
};

export default Controls;
