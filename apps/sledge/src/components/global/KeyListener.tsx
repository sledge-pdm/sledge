import { Component, onCleanup, onMount } from 'solid-js';
import { activeLayer } from '~/controllers/layer/LayerListController';
import { getActiveToolCategory, getPrevActiveToolCategory, setActiveToolCategory } from '~/controllers/tool/ToolController';
import { keyConfigStore } from '~/stores/GlobalStores';
import { isKeyMatchesToEntry } from '../../controllers/config/KeyConfigController';
import { redoLayer, undoLayer } from '../../controllers/history/HistoryController';

const KeyListener: Component = () => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (isKeyMatchesToEntry(e, keyConfigStore['undo'])) {
      const active = activeLayer();
      if (active) undoLayer(active.id);
    }
    if (isKeyMatchesToEntry(e, keyConfigStore['redo'])) {
      const active = activeLayer();
      if (active) redoLayer(active.id);
    }

    if (!e.repeat) {
      if (isKeyMatchesToEntry(e, keyConfigStore['pen'])) setActiveToolCategory('pen');
      if (isKeyMatchesToEntry(e, keyConfigStore['eraser'])) setActiveToolCategory('eraser');
      if (isKeyMatchesToEntry(e, keyConfigStore['fill'])) setActiveToolCategory('fill');

      if (isKeyMatchesToEntry(e, keyConfigStore['pipette'])) setActiveToolCategory('pipette');
    }
  };
  const handleKeyUp = (e: KeyboardEvent) => {
    if (isKeyMatchesToEntry(e, keyConfigStore['pipette']) && getActiveToolCategory() === 'pipette')
      setActiveToolCategory(getPrevActiveToolCategory() || 'pen');
  };
  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  });
  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  });

  return null;
};

export default KeyListener;
