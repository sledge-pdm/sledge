import { getCurrentWindow } from '@tauri-apps/api/window';
import { Component, onMount } from 'solid-js';
import { clipZoom, zoomTowardAreaCenter } from '~/features/canvas';
import { clearCoordinateCache } from '~/features/canvas/transform/CanvasPositionCalculator';
import { projectHistoryController } from '~/features/history';
import { saveProject } from '~/features/io/project/out/save';
import {
  getActiveToolCategoryId,
  getCurrentPresetConfig,
  getPrevActiveToolCategoryId,
  setActiveToolCategory,
  updateToolPresetConfig,
} from '~/features/tools/ToolController';
import { fileStore, interactStore, setAppearanceStore, toolStore } from '~/stores/EditorStores';
import { keyConfigStore } from '~/stores/GlobalStores';
import { isKeyMatchesToEntry } from '../config/KeyConfigController';

const KeyListener: Component = () => {
  // Helper function to check if the active element is an input field
  const isInputFocused = () => {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';

    return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isContentEditable;
  };

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) {
      e.preventDefault();
    }

    if (e.key === 'F6') {
      e.preventDefault();
      setAppearanceStore('onscreenControl', (v) => !v);
    }

    if (toolStore.activeToolCategory === 'rectSelection' && e.altKey) return;
    if (toolStore.activeToolCategory === 'autoSelection' && e.altKey) return;
    if (toolStore.activeToolCategory === 'lassoSelection' && e.altKey) return;

    // Check if input is focused early to avoid unnecessary processing
    const inputFocused = isInputFocused();

    if (isKeyMatchesToEntry(e, keyConfigStore()['save']) && !e.repeat) {
      e.preventDefault(); // Prevent default save action
      saveProject(fileStore.savedLocation.name, fileStore.savedLocation.path);
    }

    if (isKeyMatchesToEntry(e, keyConfigStore()['undo'])) {
      e.preventDefault(); // prevent conflict with input undo/redo
      projectHistoryController.undo();
    }
    if (isKeyMatchesToEntry(e, keyConfigStore()['redo'])) {
      e.preventDefault(); // prevent conflict with input undo/redo
      projectHistoryController.redo();
    }

    if (isKeyMatchesToEntry(e, keyConfigStore()['sizeIncrease'])) {
      const currentToolId = getActiveToolCategoryId();
      const selectedPreset = toolStore.tools[currentToolId]?.presets?.selected;
      if (selectedPreset !== undefined) {
        const presetConfig = getCurrentPresetConfig(currentToolId);
        const currentSize = presetConfig?.size;
        if (currentSize !== undefined) {
          updateToolPresetConfig(currentToolId, selectedPreset, 'size', currentSize + 1);
        }
      }
    }

    if (isKeyMatchesToEntry(e, keyConfigStore()['sizeDecrease'])) {
      const currentToolId = getActiveToolCategoryId();
      const selectedPreset = toolStore.tools[currentToolId]?.presets?.selected;
      if (selectedPreset !== undefined) {
        const presetConfig = getCurrentPresetConfig(currentToolId);
        const currentSize = presetConfig?.size;
        if (currentSize !== undefined && currentSize > 1) {
          updateToolPresetConfig(currentToolId, selectedPreset, 'size', currentSize - 1);
        }
      }
    }

    if (isKeyMatchesToEntry(e, keyConfigStore()['zoom_in'])) {
      zoom('in');
    }
    if (isKeyMatchesToEntry(e, keyConfigStore()['zoom_out'])) {
      zoom('out');
    }

    if (!e.repeat) {
      if (isKeyMatchesToEntry(e, keyConfigStore()['pen'])) setActiveToolCategory('pen');
      if (isKeyMatchesToEntry(e, keyConfigStore()['eraser'])) setActiveToolCategory('eraser');
      if (isKeyMatchesToEntry(e, keyConfigStore()['fill'])) setActiveToolCategory('fill');
      if (isKeyMatchesToEntry(e, keyConfigStore()['rect_select'])) setActiveToolCategory('rectSelection');
      if (isKeyMatchesToEntry(e, keyConfigStore()['auto_select'])) setActiveToolCategory('autoSelection');
      if (isKeyMatchesToEntry(e, keyConfigStore()['lasso_select'])) setActiveToolCategory('lassoSelection');
      if (isKeyMatchesToEntry(e, keyConfigStore()['move'])) setActiveToolCategory('move');
      if (isKeyMatchesToEntry(e, keyConfigStore()['pipette'])) {
        e.preventDefault();
        setActiveToolCategory('pipette');
      }
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (!isKeyMatchesToEntry(e, keyConfigStore()['pipette']) && getActiveToolCategoryId() === 'pipette') {
      e.preventDefault();
      setActiveToolCategory(getPrevActiveToolCategoryId() || 'pen');
    }
  };

  onMount(async () => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const unlistenUnfocusPipetteObserve = await getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      if (!focused && getActiveToolCategoryId() === 'pipette') {
        setActiveToolCategory(getPrevActiveToolCategoryId() || 'pen');
      }
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      unlistenUnfocusPipetteObserve();
    };
  });

  return null;
};

function zoom(type: 'in' | 'out') {
  const delta = type === 'out' ? -interactStore.wheelZoomStep : interactStore.wheelZoomStep;

  let zoomNew = interactStore.zoom + interactStore.zoom * delta;
  zoomNew = clipZoom(zoomNew);
  const zoomed = zoomTowardAreaCenter(zoomNew);

  if (zoomed) {
    clearCoordinateCache();
  }
}

export default KeyListener;
