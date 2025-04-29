import { Component, onCleanup, onMount } from 'solid-js';
import { activeLayer } from '../layer_list/LayerListController';
import { redoLayer, undoLayer } from '../history/HistoryController';
import { isKeyMatchesToEntry, recordKey } from './KeyConfigController';
import { keyConfigStore } from '~/stores/GlobalStores';
import { switchToolType } from '../tool/ToolController';
import { ToolType } from '~/types/Tool';

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
    if (isKeyMatchesToEntry(e, keyConfigStore['pen'])) switchToolType(ToolType.Pen);
    if (isKeyMatchesToEntry(e, keyConfigStore['eraser'])) switchToolType(ToolType.Eraser);
    if (isKeyMatchesToEntry(e, keyConfigStore['fill'])) switchToolType(ToolType.Fill);
  };
  onMount(() => {
    window.addEventListener('keydown', handleKey);
    onCleanup(() => window.removeEventListener('keydown', handleKey));
  });

  return null;
};

export default KeyListener;
