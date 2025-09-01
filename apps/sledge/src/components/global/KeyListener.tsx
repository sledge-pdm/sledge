import { slice_patch_rgba } from '@sledge/wasm';
import { Component, onCleanup, onMount } from 'solid-js';
import { projectHistoryController } from '~/controllers/history/ProjectHistoryController';
import { getActiveAgent } from '~/controllers/layer/LayerAgentManager';
import { activeIndex, addLayerTo } from '~/controllers/layer/LayerListController';
import { setBottomBarText } from '~/controllers/log/LogController';
import { floatingMoveManager } from '~/controllers/selection/FloatingMoveManager';
import { selectionManager } from '~/controllers/selection/SelectionAreaManager';
import { cancelMove, cancelSelection, isSelectionAvailable, startMoveFromPasted } from '~/controllers/selection/SelectionOperator';
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
import { layerListStore } from '~/stores/ProjectStores';
import { bufferToBlob, loadImageData } from '~/utils/DataUtils';
import { openDebugViewer } from '~/utils/DebugViewer';
import { isKeyMatchesToEntry } from '../../controllers/config/KeyConfigController';

const KeyListener: Component = () => {
  const META_PREFIX = 'SLEDGE:';

  type ClipboardMeta = {
    app: 'sledge';
    v: 1;
    type: 'selection' | 'layer';
    canvas?: { width: number; height: number };
    // Optional bounding box or other future fields
  };

  const makeMetaBlob = (meta: ClipboardMeta) => new Blob([`${META_PREFIX}${JSON.stringify(meta)}`], { type: 'text/plain' });

  const readMetaFromItem = async (item: ClipboardItem): Promise<ClipboardMeta | undefined> => {
    try {
      if (!item.types.includes('text/plain')) return undefined;
      const blob = await item.getType('text/plain');
      const text = await blob.text();
      if (!text.startsWith(META_PREFIX)) return undefined;
      const parsed = JSON.parse(text.slice(META_PREFIX.length));
      if (parsed?.app === 'sledge' && parsed?.v === 1 && (parsed?.type === 'selection' || parsed?.type === 'layer')) {
        return parsed as ClipboardMeta;
      }
    } catch (e) {
      // ignore parse errors
    }
    return undefined;
  };
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
      if (isSelectionAvailable()) {
        const width = activeAgent.getWidth();
        const height = activeAgent.getHeight();
        const selectionBlob = await bufferToBlob({
          buffer: slice_patch_rgba(
            // source
            new Uint8Array(activeAgent.getBuffer().buffer),
            width,
            height,
            // mask
            new Uint8Array(selectionManager.getCombinedMask()),
            width,
            height,
            0,
            0
          ),
          width,
          height,
        });
        const meta = makeMetaBlob({ app: 'sledge', v: 1, type: 'selection', canvas: { width, height } });
        await navigator.clipboard.write([new ClipboardItem({ 'text/plain': meta, [selectionBlob.type]: selectionBlob })]);

        setBottomBarText('selection copied!', {
          kind: 'info',
        });
      } else {
        const layerBlob = await bufferToBlob({
          buffer: new Uint8Array(activeAgent.getBuffer()),
          width: activeAgent.getWidth(),
          height: activeAgent.getHeight(),
        });
        const meta = makeMetaBlob({
          app: 'sledge',
          v: 1,
          type: 'layer',
          canvas: { width: activeAgent.getWidth(), height: activeAgent.getHeight() },
        });
        await navigator.clipboard.write([new ClipboardItem({ 'text/plain': meta, [layerBlob.type]: layerBlob })]);

        setBottomBarText('layer copied!', {
          kind: 'info',
        });
      }
    }
  };

  const handlePaste = async (e: ClipboardEvent) => {
    const inputFocused = isInputFocused();
    if (inputFocused) return;
    e.preventDefault();

    try {
      const items = await navigator.clipboard.read();
      for (const clipboardItem of items) {
        const meta = await readMetaFromItem(clipboardItem);
        const imageType = clipboardItem.types.find((type) => type.startsWith('image/'));
        if (!imageType) continue;

        const blob = await clipboardItem.getType(imageType);
        // Decode image blob into ImageBitmap -> ImageData to get raw RGBA pixels
        const bitmap = await createImageBitmap(blob);
        const imageData = await loadImageData(bitmap);

        if (meta?.type === 'selection') {
          // Start floating move with pasted buffer
          const targetLayerId = layerListStore.activeLayerId;
          if (targetLayerId) {
            startMoveFromPasted(imageData);
          } else {
            // Fallback: add as a new layer
            addLayerTo(activeIndex(), { name: 'pasted selection' }, { initImage: new Uint8ClampedArray(imageData.data) });
          }
        } else {
          // Default: paste as a new layer
          addLayerTo(activeIndex(), { name: 'pasted layer' }, { initImage: new Uint8ClampedArray(imageData.data) });
        }

        break; // Assuming only one image is needed
      }
    } catch (err) {
      console.error('Failed to read clipboard contents:', err);
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
  });
  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    document.removeEventListener('copy', handleCopy);
    document.removeEventListener('paste', handlePaste);
  });

  return null;
};

export default KeyListener;
