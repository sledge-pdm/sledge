import { Image } from '@tauri-apps/api/image';
import { writeImage } from '@tauri-apps/plugin-clipboard-manager';
import { Component, onMount } from 'solid-js';
import { createEntryFromRawBuffer, insertEntry, selectEntry } from '~/features/image_pool';
import { isInputFocused, tryGetImageFromClipboard } from '~/features/io/clipboard/ClipboardUtils';
import { activeLayer, removeLayer } from '~/features/layer';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { setBottomBarText } from '~/features/log/service';
import { cancelSelection, deleteSelectedArea, getCurrentSelectionBuffer, isSelectionAvailable } from '~/features/selection/SelectionOperator';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { layerListStore } from '~/stores/ProjectStores';
import { eventBus, Events } from '~/utils/EventBus';

const ClipboardListener: Component = () => {
  const handleCopy = async (e?: ClipboardEvent): Promise<'layer' | 'selection' | undefined> => {
    const inputFocused = isInputFocused();
    if (inputFocused) return;
    e?.preventDefault();

    try {
      const layer = activeLayer();
      const activeAnvil = getAnvilOf(layer.id);
      if (!activeAnvil) return;

      if (isSelectionAvailable()) {
        // Selection copy
        const bufData = getCurrentSelectionBuffer();
        if (!bufData) return;
        const { buffer, bbox } = bufData;
        const image = await Image.new(buffer, bbox.width, bbox.height);
        await writeImage(image);
        // if succeed, save offset as a placement position
        setInteractStore('placementPosition', {
          x: bbox.x,
          y: bbox.y,
        });
        setBottomBarText('selection copied!', { kind: 'info' });
        return 'selection';
      } else {
        // Layer copy
        const buffer = activeAnvil.getBufferPointer();
        const image = await Image.new(new Uint8Array(buffer.buffer), activeAnvil.getWidth(), activeAnvil.getHeight());
        await writeImage(image);

        // We must not destroy data that may referenced in later paste operation.
        // image.close();

        // if succeed, save (0, 0) as a placement position
        setInteractStore('placementPosition', {
          x: 0,
          y: 0,
        });
        setBottomBarText('layer copied!', { kind: 'info' });
        return 'layer';
      }
    } catch (e) {
      setBottomBarText('copy failed.', { kind: 'error' });
    }
  };

  const handleCut = async (e?: ClipboardEvent) => {
    const inputFocused = isInputFocused();
    if (inputFocused) return;
    e?.preventDefault();

    const copyMode = await handleCopy(e); // this doesn't add history
    if (!copyMode) return;

    if (copyMode === 'layer') {
      removeLayer(layerListStore.activeLayerId); // history added
    } else {
      deleteSelectedArea({
        layerId: layerListStore.activeLayerId,
        noAction: false,
      }); // history added
    }
  };

  const handlePaste = async (e?: ClipboardEvent) => {
    const inputFocused = isInputFocused();
    if (inputFocused) return;
    e?.preventDefault();

    try {
      if (isSelectionAvailable()) cancelSelection();

      const data = await tryGetImageFromClipboard();
      if (data) {
        const { imageBuf, width, height } = data;
        const entry = await createEntryFromRawBuffer(imageBuf, width, height);
        entry.descriptionName = '[ from clipboard ]';
        const placementPos = interactStore.placementPosition ?? { x: 0, y: 0 };
        entry.transform.x = placementPos.x;
        entry.transform.y = placementPos.y;
        insertEntry(entry);
        selectEntry(entry.id);
        setBottomBarText('pasted!');
      } else {
        console.error('Failed to read clipboard contents.');
        setBottomBarText('paste failed.', { kind: 'error' });
      }
    } catch (err) {
      console.error('Failed to read clipboard contents:', err);
      setBottomBarText('paste failed.', { kind: 'error' });
    }
  };

  const handleDoCopy = (e: Events['clipboard:doCopy']) => handleCopy();
  const handleDoCut = (e: Events['clipboard:doCut']) => handleCut();
  const handleDoPaste = (e: Events['clipboard:doPaste']) => handlePaste();

  onMount(() => {
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);

    eventBus.on('clipboard:doCopy', handleDoCopy);
    eventBus.on('clipboard:doCut', handleDoCut);
    eventBus.on('clipboard:doPaste', handleDoPaste);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);

      eventBus.off('clipboard:doCopy', handleDoCopy);
      eventBus.off('clipboard:doCut', handleDoCut);
      eventBus.off('clipboard:doPaste', handleDoPaste);
    };
  });

  return null;
};

export default ClipboardListener;
