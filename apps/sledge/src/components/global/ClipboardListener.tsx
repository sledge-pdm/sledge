import { slice_patch_rgba, trim_mask_with_box } from '@sledge/wasm';
import { Component, onCleanup, onMount } from 'solid-js';
import { activeIndex, activeLayer, addLayerTo } from '~/features/layer';
import { getAgentOf } from '~/features/layer/agent/LayerAgentManager';
import { setBottomBarText } from '~/features/log/service';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { isSelectionAvailable, startMoveFromPasted } from '~/features/selection/SelectionOperator';
import { layerListStore } from '~/stores/ProjectStores';
import { bufferToBlob, loadImageData } from '~/utils/DataUtils';

const ClipboardListener: Component = () => {
  const META_PREFIX = 'SLEDGE:';

  type ClipboardMeta = {
    app: 'sledge';
    v: 1;
    type: 'selection' | 'layer';
    canvas?: { width: number; height: number };
    sourceName?: string;
    // Optional bounding box or other future fields
    bbox?: { x: number; y: number; width: number; height: number };
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

  // Compute tight bounding box of 1s in a canvas-sized selection mask
  const computeMaskBBox = (mask: Uint8Array, width: number, height: number): { x: number; y: number; width: number; height: number } | undefined => {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y++) {
      const row = y * width;
      for (let x = 0; x < width; x++) {
        if (mask[row + x] === 1) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0 || maxY < 0) return undefined;
    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  };

  // Helper function to check if the active element is an input field
  const isInputFocused = () => {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';

    return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isContentEditable;
  };

  const handleCopy = async (e: ClipboardEvent) => {
    const inputFocused = isInputFocused();
    if (inputFocused) return;
    e.preventDefault();

    const layer = activeLayer();
    const activeAgent = getAgentOf(layer.id);
    if (activeAgent) {
      if (isSelectionAvailable()) {
        const width = activeAgent.getWidth();
        const height = activeAgent.getHeight();
        selectionManager.commitOffset();
        const mask = selectionManager.getCombinedMask();
        const bbox = computeMaskBBox(mask, width, height);
        if (!bbox) return;
        const trimmedMask = trim_mask_with_box(mask, width, height, bbox.x, bbox.y, bbox.width, bbox.height);
        const selectionBlob = await bufferToBlob({
          buffer: slice_patch_rgba(
            // source
            new Uint8Array(activeAgent.getBuffer().buffer),
            width,
            height,
            // mask
            new Uint8Array(trimmedMask),
            bbox.width,
            bbox.height,
            bbox.x,
            bbox.y
          ),
          width: bbox.width,
          height: bbox.height,
        });
        const meta = makeMetaBlob({
          app: 'sledge',
          v: 1,
          type: 'selection',
          canvas: { width, height },
          sourceName: layer.name,
          bbox: bbox ?? undefined,
        });
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
          sourceName: layer.name,
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
          if (targetLayerId && meta.bbox) {
            startMoveFromPasted(imageData, meta.bbox);
          } else {
            // Fallback: add as a new layer
            addLayerTo(activeIndex(), { name: meta?.sourceName ?? 'pasted selection' }, { initImage: new Uint8ClampedArray(imageData.data) });
          }
        } else {
          // Default: paste as a new layer
          addLayerTo(activeIndex(), { name: meta?.sourceName ?? 'pasted layer' }, { initImage: new Uint8ClampedArray(imageData.data) });
        }

        break; // Assuming only one image is needed
      }
    } catch (err) {
      console.error('Failed to read clipboard contents:', err);
    }
  };

  onMount(() => {
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
  });
  onCleanup(() => {
    document.removeEventListener('copy', handleCopy);
    document.removeEventListener('paste', handlePaste);
  });

  return null;
};

export default ClipboardListener;
