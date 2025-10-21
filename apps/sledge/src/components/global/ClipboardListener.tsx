import { rawToPng } from '@sledge/anvil';
import { slice_patch_rgba, trim_mask_with_box } from '@sledge/wasm';
import { Component, onMount } from 'solid-js';
import { activeIndex, activeLayer, addLayerTo, removeLayer } from '~/features/layer';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { setBottomBarText } from '~/features/log/service';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { deleteSelectedArea, isSelectionAvailable, startMoveFromPasted } from '~/features/selection/SelectionOperator';
import { layerListStore } from '~/stores/ProjectStores';
import { loadImageData } from '~/utils/DataUtils';
import { eventBus, Events } from '~/utils/EventBus';

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

  // Create PNG blob from RGBA buffer using WASM
  const createPngBlob = (buffer: Uint8Array, width: number, height: number): Blob => {
    const pngBuffer = rawToPng(buffer, width, height);
    // Convert to standard Uint8Array to ensure compatibility with Blob
    const standardBuffer = new Uint8Array(pngBuffer.length);
    standardBuffer.set(pngBuffer);
    return new Blob([standardBuffer], { type: 'image/png' });
  };

  const handleCopy = async (e?: ClipboardEvent): Promise<'layer' | 'selection' | undefined> => {
    const inputFocused = isInputFocused();
    if (inputFocused) return;
    e?.preventDefault();

    const layer = activeLayer();
    const activeAnvil = getAnvilOf(layer.id);
    if (!activeAnvil) return;

    if (isSelectionAvailable()) {
      // Selection copy
      const width = activeAnvil.getWidth();
      const height = activeAnvil.getHeight();
      selectionManager.commitOffset();
      const mask = selectionManager.getCombinedMask();
      const bbox = computeMaskBBox(mask, width, height);
      if (!bbox) return;

      const trimmedMask = trim_mask_with_box(mask, width, height, bbox.x, bbox.y, bbox.width, bbox.height);
      const selectionBuffer = slice_patch_rgba(
        new Uint8Array(activeAnvil.getBufferCopy().buffer),
        width,
        height,
        new Uint8Array(trimmedMask),
        bbox.width,
        bbox.height,
        bbox.x,
        bbox.y
      );

      // Convert to PNG using WASM
      const selectionBlob = createPngBlob(selectionBuffer, bbox.width, bbox.height);

      const meta = makeMetaBlob({
        app: 'sledge',
        v: 1,
        type: 'selection',
        canvas: { width, height },
        sourceName: layer.name,
        bbox,
      });

      await navigator.clipboard.write([new ClipboardItem({ 'text/plain': meta, 'image/png': selectionBlob })]);

      setBottomBarText('selection copied!', { kind: 'info' });
      return 'selection';
    } else {
      // Layer copy
      const buffer = new Uint8Array(activeAnvil.getBufferPointer());
      const width = activeAnvil.getWidth();
      const height = activeAnvil.getHeight();

      // Convert to PNG using WASM
      const layerBlob = createPngBlob(buffer, width, height);

      const meta = makeMetaBlob({
        app: 'sledge',
        v: 1,
        type: 'layer',
        sourceName: layer.name,
        canvas: { width, height },
      });

      await navigator.clipboard.write([new ClipboardItem({ 'text/plain': meta, 'image/png': layerBlob })]);

      setBottomBarText('layer copied!', { kind: 'info' });
      return 'layer';
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
      deleteSelectedArea(layerListStore.activeLayerId); // history added
    }
  };

  const handlePaste = async (e?: ClipboardEvent) => {
    const inputFocused = isInputFocused();
    if (inputFocused) return;
    e?.preventDefault();

    try {
      const items = await navigator.clipboard.read();
      for (const clipboardItem of items) {
        const meta = await readMetaFromItem(clipboardItem);

        // Try to get any image format
        const imageType: string | undefined = clipboardItem.types.find((type) => type.startsWith('image/'));
        if (!imageType) continue;

        const blob = await clipboardItem.getType(imageType);
        // Decode image blob into ImageBitmap -> ImageData to get raw RGBA pixels
        const bitmap = await createImageBitmap(blob);
        const imageData = await loadImageData(bitmap);

        if (meta?.type === 'selection') {
          // Start floating move with pasted buffer
          const targetLayerId = layerListStore.activeLayerId;
          if (targetLayerId && meta.bbox) {
            startMoveFromPasted(imageData, meta.bbox); // history will be added when move confirmed. selection cut(delete) is currently stored as individual history, so deleted area will not be restored by one undo.
          } else {
            // Fallback: add as a new layer
            addLayerTo(activeIndex(), { name: meta?.sourceName ?? 'pasted selection' }, { initImage: new Uint8ClampedArray(imageData.data) }); // history added(LayerList)
          }
        } else {
          // Default: paste as a new layer
          addLayerTo(activeIndex(), { name: meta?.sourceName ?? 'pasted layer' }, { initImage: new Uint8ClampedArray(imageData.data) }); // history added(LayerList)
        }

        break; // Assuming only one image is needed
      }
    } catch (err) {
      console.error('Failed to read clipboard contents:', err);
    }
  };

  onMount(() => {
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);

    const handleDoCopy = (e: Events['clipboard:doCopy']) => handleCopy();
    const handleDoCut = (e: Events['clipboard:doCut']) => handleCut();
    const handleDoPaste = (e: Events['clipboard:doPaste']) => handlePaste();
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
