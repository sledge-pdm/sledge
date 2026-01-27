import { toUint8Array } from '@sledge-pdm/core';
import { doCommandsWithRegister } from '~/features/history';
import { CutPasteCommands } from '~/features/history/command/snippet/CutPasteCommands';
import { createEntryFromRawBuffer, insertEntry, selectEntry } from '~/features/image_pool';
import { activeIndex, addLayerTo, findLayerById, setLayerProp } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logSystemError, logUserError, logUserSuccess } from '~/features/log';
import { cancelSelection, deleteSelectedArea, getCurrentSelectionBuffer, isSelectionAvailable } from '~/features/selection/SelectionOperator';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { clipboard, image } from '~/utils/platform';
import { isInputFocused, tryGetImageFromClipboard, tryGetTextFromClipboard } from './ClipboardUtils';

const LOG_LABEL = 'ClipboardActions';

export async function clipboardCopy(e?: ClipboardEvent): Promise<'layer' | 'selection' | undefined> {
  const inputFocused = isInputFocused();
  if (inputFocused) return;
  e?.preventDefault();

  try {
    if (isSelectionAvailable()) {
      const bufData = getCurrentSelectionBuffer();
      if (!bufData) return;
      const { buffer, bbox } = bufData;
      const clipboardImage = await image.create(toUint8Array(buffer), bbox.width, bbox.height);
      await clipboard.writeImage(clipboardImage);
      setInteractStore('placementPosition', {
        x: bbox.x,
        y: bbox.y,
      });
      logUserSuccess('selection copied!', { label: LOG_LABEL });
      return 'selection';
    } else {
      await clipboard.writeText(projectStore.layers.state.activeLayerId);
      logUserSuccess('layer copied!', { label: LOG_LABEL });
      return 'layer';
    }
  } catch (e) {
    logUserError('copy failed.', { label: LOG_LABEL, details: [e] });
  }
}

export async function clipboardCut(e?: ClipboardEvent) {
  const inputFocused = isInputFocused();
  if (inputFocused) return;
  e?.preventDefault();

  const copyMode = await clipboardCopy(e); // this doesn't add history
  if (!copyMode) return;

  if (copyMode === 'layer') {
    // this literally delete original layer to copy so cannot paste after.
    // this should be like an "archive" operation, that freezes layer but not delete from list and anvilManager. like below.
    setLayerProp(projectStore.layers.state.activeLayerId, 'cutFreeze', true, { noDiff: true }); // history added
    // removeLayer(projectStore.layers.state.activeLayerId, { noDiff: false }); // history added
  } else {
    deleteSelectedArea({
      layerId: projectStore.layers.state.activeLayerId,
      noAction: false,
    }); // history added
  }
}

export async function clipboardPaste(e?: ClipboardEvent) {
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
        const srcFrascoLayer = layerManager.getLayerOptional(textData);
        if (!srcFrascoLayer) {
          logUserError('layer buffer not found.', { label: LOG_LABEL });
          return;
        }
        const srcBuffer = new Uint8ClampedArray(srcFrascoLayer.readPixels({ flipY: true }));
        const isCut = srcLayer.cutFreeze;
        setLayerProp(srcLayer.id, 'cutFreeze', false, { noDiff: true });
        if (srcLayer && isCut) {
          // const activeLayerIdBefore = activeLayer().id;
          // const sourcePackedSnapshot = getPackedLayerSnapshot(unfreezedSourceLayer.id);
          // const sourceIndex = getLayerIndex(unfreezedSourceLayer.id);

          const insertIndex = activeIndex();
          doCommandsWithRegister(CutPasteCommands(insertIndex, srcLayer, srcBuffer));
          // removeLayer(unfreezedSourceLayer.id, { noDiff: true });
        } else {
          addLayerTo(activeIndex(), srcLayer, { initImage: srcBuffer, noDiff: false, uniqueName: false });
        }
      }
    } else {
      // 2. check image paste
      const data = await tryGetImageFromClipboard();
      if (data) {
        const { buffer, width, height } = data;
        const { entry, image } = await createEntryFromRawBuffer(buffer, width, height);
        entry.descriptionName = '[ from clipboard ]';
        const placementPos = interactStore.placementPosition ?? { x: 0, y: 0 };
        entry.transform.x = placementPos.x;
        entry.transform.y = placementPos.y;
        insertEntry(entry, image);
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
}
