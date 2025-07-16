import { Component, onCleanup, onMount } from 'solid-js';
import { activeLayer } from '~/controllers/layer/LayerListController';
import { setActiveToolCategory } from '~/controllers/tool/ToolController';
import { keyConfigStore } from '~/stores/GlobalStores';
import { isKeyMatchesToEntry } from '../../controllers/config/KeyConfigController';
import { redoLayer, undoLayer } from '../../controllers/history/HistoryController';

const KeyListener: Component = () => {
  const handleKey = (e: KeyboardEvent) => {
    if (isKeyMatchesToEntry(e, keyConfigStore['undo'])) {
      const active = activeLayer();
      if (active) undoLayer(active.id);
    }
    if (isKeyMatchesToEntry(e, keyConfigStore['redo'])) {
      const active = activeLayer();
      if (active) redoLayer(active.id);
    }
    if (isKeyMatchesToEntry(e, keyConfigStore['pen'])) setActiveToolCategory('pen');
    if (isKeyMatchesToEntry(e, keyConfigStore['eraser'])) setActiveToolCategory('eraser');
    if (isKeyMatchesToEntry(e, keyConfigStore['fill'])) setActiveToolCategory('fill');
  };
  onMount(() => window.addEventListener('keydown', handleKey));
  onCleanup(() => window.removeEventListener('keydown', handleKey));

  return null;
};

export default KeyListener;
