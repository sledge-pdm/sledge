import { Component, onCleanup, onMount } from 'solid-js';
import { projectHistoryController } from '~/controllers/history/ProjectHistoryController';
import { getActiveAgent } from '~/controllers/layer/LayerAgentManager';
import { activeIndex, addLayerTo } from '~/controllers/layer/LayerListController';
import { setBottomBarText } from '~/controllers/log/LogController';
import {
  getActiveToolCategoryId,
  getCurrentPresetConfig,
  getPrevActiveToolCategoryId,
  setActiveToolCategory,
  updateToolPresetConfig,
} from '~/controllers/tool/ToolController';
import { saveProject } from '~/io/project/out/save';
import { fileStore, toolStore } from '~/stores/EditorStores';
import { keyConfigStore } from '~/stores/GlobalStores';
import { bufferToBlob, loadImageData } from '~/utils/DataUtils';
import { openDebugViewer } from '~/utils/DebugViewer';
import { isKeyMatchesToEntry } from '../../controllers/config/KeyConfigController';

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

    if (toolStore.activeToolCategory === 'rectSelection' && e.altKey) return;
    if (toolStore.activeToolCategory === 'autoSelection' && e.altKey) return;

    // Check if input is focused early to avoid unnecessary processing
    const inputFocused = isInputFocused();

    if (isKeyMatchesToEntry(e, keyConfigStore['save']) && !e.repeat) {
      e.preventDefault(); // Prevent default save action
      saveProject(fileStore.location.name, fileStore.location.path);
    }

    // デバッグビューア用ショートカット (Ctrl+Shift+D) - always allow this
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      openDebugViewer();
    }

    // Skip other shortcuts if an input field is focused
    if (inputFocused) {
      return;
    }

    if (isKeyMatchesToEntry(e, keyConfigStore['undo'])) {
      projectHistoryController.undo();
    }
    if (isKeyMatchesToEntry(e, keyConfigStore['redo'])) {
      projectHistoryController.redo();
    }

    if (isKeyMatchesToEntry(e, keyConfigStore['sizeIncrease'])) {
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

    if (isKeyMatchesToEntry(e, keyConfigStore['sizeDecrease'])) {
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

    if (isKeyMatchesToEntry(e, keyConfigStore['pipette'])) setActiveToolCategory('pipette');

    if (!e.repeat) {
      if (isKeyMatchesToEntry(e, keyConfigStore['pen'])) setActiveToolCategory('pen');
      if (isKeyMatchesToEntry(e, keyConfigStore['eraser'])) setActiveToolCategory('eraser');
      if (isKeyMatchesToEntry(e, keyConfigStore['fill'])) setActiveToolCategory('fill');
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    // Skip shortcuts if an input field is focused
    if (isInputFocused()) {
      return;
    }

    if (!isKeyMatchesToEntry(e, keyConfigStore['pipette']) && getActiveToolCategoryId() === 'pipette') {
      console.log('Pipette tool deactivated');
      setActiveToolCategory(getPrevActiveToolCategoryId() || 'pen');
    }
  };

  const handleCopy = async (e: ClipboardEvent) => {
    const inputFocused = isInputFocused();
    if (inputFocused) return;
    e.preventDefault();

    const activeAgent = getActiveAgent();
    if (activeAgent) {
      const blob = await bufferToBlob({
        buffer: new Uint8Array(activeAgent.getBuffer()),
        width: activeAgent.getWidth(),
        height: activeAgent.getHeight(),
      });
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);

      setBottomBarText('layer copied!', {
        kind: 'info',
      });
    }
  };

  const handlePaste = async (e: ClipboardEvent) => {
    const inputFocused = isInputFocused();
    if (inputFocused) return;
    e.preventDefault();

    try {
      const items = await navigator.clipboard.read();
      for (const clipboardItem of items) {
        const imageType = clipboardItem.types.find((type) => type.startsWith('image/'));
        if (imageType) {
          const blob = await clipboardItem.getType(imageType);
          // Decode image blob into ImageBitmap -> ImageData to get raw RGBA pixels
          const bitmap = await createImageBitmap(blob);
          const imageData = await loadImageData(bitmap);
          // imageData.data is a Uint8ClampedArray of length width * height * 4
          addLayerTo(
            activeIndex(),
            {
              name: 'pasted layer',
            },
            {
              initImage: new Uint8ClampedArray(imageData.data),
            }
          );
          break; // Assuming only one image is needed
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard contents:', err);
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('copy', (e) => handleCopy(e));
    document.addEventListener('paste', (e) => handlePaste(e));
  });
  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    document.removeEventListener('copy', (e) => handleCopy(e));
    document.removeEventListener('paste', (e) => handlePaste(e));
  });

  return null;
};

export default KeyListener;
