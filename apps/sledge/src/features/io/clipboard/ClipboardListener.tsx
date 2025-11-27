import { toUint8Array } from '@sledge/anvil';
import { Image } from '@tauri-apps/api/image';
import { writeImage, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { Component, onMount } from 'solid-js';
import { projectHistoryController } from '~/features/history';
import { LayerListCutPasteHistoryAction } from '~/features/history/actions/LayerListCutPasteHistoryAction';
import { getPackedLayerSnapshot } from '~/features/history/actions/utils';
import { createEntryFromRawBuffer, insertEntry, selectEntry } from '~/features/image_pool';
import { isInputFocused, tryGetImageFromClipboard, tryGetTextFromClipboard } from '~/features/io/clipboard/ClipboardUtils';
import { activeIndex, activeLayer, addLayerTo, findLayerById, getLayerIndex, removeLayer, setActiveLayerId, setLayerProp } from '~/features/layer';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { logSystemError, logUserError, logUserSuccess } from '~/features/log/service';
import { cancelSelection, deleteSelectedArea, getCurrentSelectionBuffer, isSelectionAvailable } from '~/features/selection/SelectionOperator';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { layerListStore } from '~/stores/ProjectStores';
import { eventBus, Events } from '~/utils/EventBus';

const LOG_LABEL = 'ClipboardListener';

const ClipboardListener: Component = () => {
  const handleCopy = async (e?: ClipboardEvent): Promise<'layer' | 'selection' | undefined> => {
    const inputFocused = isInputFocused();
    if (inputFocused) return;
    e?.preventDefault();

    try {
      if (isSelectionAvailable()) {
        const bufData = getCurrentSelectionBuffer();
        if (!bufData) return;
        const { buffer, bbox } = bufData;
        const image = await Image.new(toUint8Array(buffer), bbox.width, bbox.height);
        await writeImage(image);
        setInteractStore('placementPosition', {
          x: bbox.x,
          y: bbox.y,
        });
        logUserSuccess('selection copied!', { label: LOG_LABEL });
        return 'selection';
      } else {
        await writeText(layerListStore.activeLayerId);
        logUserSuccess('layer copied!', { label: LOG_LABEL });
        return 'layer';
      }
    } catch (e) {
      logUserError('copy failed.', { label: LOG_LABEL, details: [e] });
    }
  };

  const handleCut = async (e?: ClipboardEvent) => {
    const inputFocused = isInputFocused();
    if (inputFocused) return;
    e?.preventDefault();

    const copyMode = await handleCopy(e); // this doesn't add history
    if (!copyMode) return;

    if (copyMode === 'layer') {
      // this literally delete original layer to copy so cannot paste after.
      // this should be like an "archive" operation, that freezes layer but not delete from list and anvilManager. like below.
      setLayerProp(layerListStore.activeLayerId, 'cutFreeze', true, { noDiff: true }); // history added
      // removeLayer(layerListStore.activeLayerId, { noDiff: false }); // history added
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

      // 1. check layer id paste
      const textData = await tryGetTextFromClipboard();
      if (textData) {
        const srcLayer = findLayerById(textData);
        if (srcLayer) {
          const srcAnvil = getAnvil(textData);
          const isCut = srcLayer.cutFreeze;
          // 切り取りと分かった時点でcutFreezeは取り下げる
          setLayerProp(srcLayer.id, 'cutFreeze', false, { noDiff: true });
          const unfreezedSourceLayer = findLayerById(textData);
          if (unfreezedSourceLayer && isCut) {
            const activeLayerIdBefore = activeLayer().id;
            const sourcePackedSnapshot = getPackedLayerSnapshot(unfreezedSourceLayer.id);
            const sourceIndex = getLayerIndex(unfreezedSourceLayer.id);

            const insertionIndex = activeIndex();
            const inserted = addLayerTo(
              insertionIndex,
              { ...unfreezedSourceLayer, cutFreeze: false }, // ensure cutFreeze=false
              { initImage: srcAnvil.getBufferCopy(), noDiff: true, uniqueName: false }
            );

            removeLayer(unfreezedSourceLayer.id, { noDiff: true });

            const targetPackedSnapshot = getPackedLayerSnapshot(inserted.id);
            const targetIndex = getLayerIndex(inserted.id);
            setActiveLayerId(inserted.id);

            const activeLayerIdAfter = activeLayer().id;
            if (sourcePackedSnapshot && targetPackedSnapshot) {
              const action = new LayerListCutPasteHistoryAction({
                sourcePackedSnapshot,
                sourceIndex, // 挿入前に取得した index
                targetPackedSnapshot,
                targetIndex, // 削除後の挿入レイヤー index
                activeLayerIdBefore,
                activeLayerIdAfter,
              });
              projectHistoryController.addAction(action);
            }
          } else {
            addLayerTo(activeIndex(), srcLayer, { initImage: srcAnvil.getBufferCopy(), noDiff: false, uniqueName: false });
          }
        }
      } else {
        // 2. check image paste
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
          logUserSuccess('pasted!', { label: LOG_LABEL });
        } else {
          logSystemError('Failed to read clipboard contents.', { label: LOG_LABEL });
          logUserError('paste failed.', { label: LOG_LABEL });
        }
      }
    } catch (err) {
      logSystemError('Failed to read clipboard contents.', { label: LOG_LABEL, details: [err] });
      logUserError('paste failed.', { label: LOG_LABEL, details: [err] });
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
