import { toUint8Array } from '@sledge-pdm/core';
import { runExclusive } from '~/features/busy';
import { refuseIfExclusiveEditSession } from '~/features/edit_session';
import { doCommands } from '~/features/history';
import { LayerReorderCommand } from '~/features/history/command/layer/LayerReorderCommand';
import { cutPasteSnippet } from '~/features/history/commands';
import { createEntryFromRawBuffer, insertEntry, selectEntry } from '~/features/image_pool';
import { activeIndex, addLayerTo, findLayerById, setLayerProp } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { getOperationTargetLayerIds } from '~/features/layer/service';
import { logSystemError, logUserError, logUserSuccess } from '~/features/log';
import { selectionManager } from '~/features/selection/SelectionManager';
import { cancelSelection, deleteSelectedArea, getCurrentSelectionBuffer } from '~/features/selection/service';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { clipboard, image } from '~/utils/platform';
import { isInputFocused, tryGetImageFromClipboard, tryGetTextFromClipboard } from './ClipboardUtils';

const LOG_LABEL = 'ClipboardActions';

export async function clipboardCopy(e?: ClipboardEvent): Promise<'layer' | 'selection' | undefined> {
  return await runExclusive('clipboardCopy', () => copyInternal(e));
}

/** @description the copy itself, without taking the window - a cut runs this inside its own period. */
async function copyInternal(e?: ClipboardEvent): Promise<'layer' | 'selection' | undefined> {
  const inputFocused = isInputFocused();
  if (inputFocused) return;
  // a floating move's pixels are not in the layer yet, so a copy taken now would read the hole they left
  // rather than what the user can see. covers the cut that runs this as its first half, too.
  if (refuseIfExclusiveEditSession('copying')) return;
  e?.preventDefault();

  try {
    if (selectionManager.hasSelection()) {
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

export async function clipboardCut(e?: ClipboardEvent, layerIds?: string[]) {
  await runExclusive('clipboardCut', () => cutInternal(e, layerIds));
}

async function cutInternal(e?: ClipboardEvent, layerIds?: string[]) {
  const inputFocused = isInputFocused();
  if (inputFocused) return;
  e?.preventDefault();

  const targets = getOperationTargetLayerIds(layerIds);
  // A layer-list action always cuts whole layers. Multiple selected layers also take precedence over
  // a pixel selection; the single-layer canvas action retains its selection-copy/delete behavior.
  if (layerIds !== undefined || targets.length > 1 || !selectionManager.hasSelection()) {
    if (refuseIfExclusiveEditSession('cutting')) return;
    if (targets.length === 0) return;
    try {
      const text = targets.length === 1 ? targets[0] : JSON.stringify({ type: 'sledge/layers', layerIds: targets });
      await clipboard.writeText(text);
      targets.forEach((id) => setLayerProp(id, 'cutFreeze', true, { register: false }));
      logUserSuccess(targets.length === 1 ? 'layer cut!' : 'layers cut!', { label: LOG_LABEL });
    } catch (err) {
      logUserError('cut failed.', { label: LOG_LABEL, details: [err] });
    }
    return;
  }

  // the copy is the first half of the cut, not an operation of its own: it runs inside the window the cut
  // already holds, so the delete below removes exactly what was copied.
  const copyMode = await copyInternal(e); // this doesn't add history
  if (!copyMode) return;

  deleteSelectedArea({
    layerId: projectStore.layers.state.activeLayerId,
    noAction: false,
  }); // history added
}

function getClipboardLayerIds(text: string): string[] | undefined {
  try {
    const data = JSON.parse(text);
    if (data?.type !== 'sledge/layers' || !Array.isArray(data.layerIds) || data.layerIds.length < 2) return;
    if (!data.layerIds.every((id: unknown) => typeof id === 'string')) return;
    return Array.from(new Set<string>(data.layerIds));
  } catch {
    return;
  }
}

function pasteLayers(layerIds: string[]) {
  const sources = layerIds.map((id) => findLayerById(id));
  // Do not partially paste a group whose source layers have been removed.
  if (sources.some((layer) => !layer || !layerManager.getLayerOptional(layer.id))) return;
  const layers = sources.map((layer) => layer!);
  if (layers.every((layer) => layer.cutFreeze)) {
    const beforeOrder = projectStore.layers.layers.map((layer) => layer.id);
    const targetIndex = activeIndex();
    const remaining = beforeOrder.filter((id) => !layerIds.includes(id));
    const insertIndex = beforeOrder.slice(0, Math.max(0, targetIndex)).filter((id) => !layerIds.includes(id)).length;
    const afterOrder = [...remaining.slice(0, insertIndex), ...layerIds, ...remaining.slice(insertIndex)];
    layers.forEach((layer) => setLayerProp(layer.id, 'cutFreeze', false, { register: false }));
    doCommands(new LayerReorderCommand({ beforeOrder, afterOrder }), {
      context: { icon: '/assets/icons/context_menu/cut.png', description: `paste ${layers.length} cut layers` },
    });
  } else {
    const insertIndex = activeIndex();
    layers.forEach((layer, index) => {
      const buffer = layerManager.exportRawCanvas(layer.id);
      addLayerTo(insertIndex + index, { ...layer, cutFreeze: false }, { initImage: buffer, register: false, uniqueName: false });
    });
  }
}

export async function clipboardPaste(e?: ClipboardEvent) {
  await runExclusive('clipboardPaste', () => pasteInternal(e));
}

async function pasteInternal(e?: ClipboardEvent) {
  const inputFocused = isInputFocused();
  if (inputFocused) return;
  // this used to lean on `hasSelection()` below to fold away a move in flight, but a move starts by
  // clearing the selection it lifted (see `MoveTool.startMove`), so that test never saw one and a paste
  // went ahead with the move still floating over a layer it was about to edit.
  if (refuseIfExclusiveEditSession('pasting')) return;
  e?.preventDefault();

  try {
    if (selectionManager.hasSelection()) cancelSelection();

    // 1. check layer id paste
    const textData = await tryGetTextFromClipboard();
    if (textData) {
      const layerIds = getClipboardLayerIds(textData);
      if (layerIds) {
        pasteLayers(layerIds);
        return;
      }
      const srcLayer = findLayerById(textData);
      if (srcLayer) {
        const srcFrascoLayer = layerManager.getLayerOptional(textData);
        if (!srcFrascoLayer) {
          logUserError('layer buffer not found.', { label: LOG_LABEL });
          return;
        }
        const srcBuffer = new Uint8ClampedArray(srcFrascoLayer.readPixels({ flipY: true }));
        const isCut = srcLayer.cutFreeze;
        setLayerProp(srcLayer.id, 'cutFreeze', false, { register: false });
        if (srcLayer && isCut) {
          // const activeLayerIdBefore = activeLayer().id;
          // const sourcePackedSnapshot = getPackedLayerSnapshot(unfreezedSourceLayer.id);
          // const sourceIndex = getLayerIndex(unfreezedSourceLayer.id);

          const insertIndex = activeIndex();
          const { commands, context } = cutPasteSnippet(insertIndex, srcLayer, srcBuffer);
          doCommands(commands, { context });
          // removeLayer(unfreezedSourceLayer.id, { register: false });
        } else {
          addLayerTo(activeIndex(), srcLayer, { initImage: srcBuffer, register: false, uniqueName: false });
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
