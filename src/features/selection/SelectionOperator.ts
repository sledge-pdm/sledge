import { Vec2 } from '@sledge-pdm/core';
import { projectHistoryController } from '~/features/history';
import { ConvertSelectionHistoryAction } from '~/features/history/actions/ConvertSelectionHistoryAction';
import { LayerHistoryAction } from '~/features/history/actions/LayerHistoryAction';
import { getPackedLayerSnapshot } from '~/features/history/actions/utils';
import { createEntryFromRawBuffer, insertEntry, selectEntry } from '~/features/image_pool';
import { activeLayer } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logUserInfo, logUserWarn } from '~/features/log/service';
import { FloatingBuffer, floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { getCurrentSelection, selectionManager } from '~/features/selection/SelectionAreaManager';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { SelectionLimitMode } from '~/stores/editor/ToolStore';
import { setToolStore, toolStore } from '~/stores/EditorStores';
import { imagePoolStore, layerListStore } from '~/stores/ProjectStores';
import { projectStore } from '~/stores/RuntimeProject';
import { eventBus } from '~/utils/EventBus';
import { createTexture, deleteTexture } from '~/utils/TextureUtils';
import { combine_masks_subtract, flip_pixels_vertically, trim_mask_with_box } from '~/utils/wasm';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';
import { clonePersistedImages, toPersistedImages } from '../image_pool/service';

// SelectionOperator is an integrated manager of selection area and floating move management.

export function isSelectionAvailable(): boolean {
  return selectionManager.isSelected();
}

/**
 * 描画制限モードに基づいて描画可能な位置かチェック
 * @param pos チェックする位置
 * @returns 描画可能な場合true、制限により描画不可の場合false
 */
export function isDrawingAllowed(pos: Vec2, checkState?: boolean): boolean {
  const limitMode = toolStore.selectionLimitMode;
  if (checkState) {
    if (limitMode === 'none') {
      // 制限なし：常に描画可能
      return true;
    }
    if (!isSelectionAvailable()) {
      // 選択範囲がない場合：制限なしとして扱う
      return true;
    }
  }

  const isInSelection = selectionManager.isMaskOverlap(pos, true);

  if (limitMode === 'inside') {
    // 選択範囲内のみ描画可能
    return isInSelection;
  } else if (limitMode === 'outside') {
    // 選択範囲外のみ描画可能
    return !isInSelection;
  }

  return true;
}

export function getSelectionLimitMode(): SelectionLimitMode {
  return toolStore.selectionLimitMode;
}

export function isPositionWithinSelection(pos: Vec2) {
  pos.x = Math.floor(pos.x);
  pos.y = Math.floor(pos.y);

  return selectionManager.isMaskOverlap(pos, true);
}

// 現在の状況からFloat状態を作成
export function startMove() {
  const layerId = layerListStore.activeLayerId;
  const width = projectStore.canvas.size.width;
  const height = projectStore.canvas.size.height;
  if (width == null || height == null) return;

  if (isSelectionAvailable()) {
    floatingMoveManager.startMove(selectionManager.getFloatingBuffer(layerId)!, 'selection', layerId);
  } else {
    selectionManager.selectAll();
    const layerFloatingBuffer: FloatingBuffer = {
      buffer: layerManager.exportRawCanvas(layerId),
      width,
      height,
      offset: { x: 0, y: 0 },
      origin: { x: 0, y: 0 },
    };
    floatingMoveManager.startMove(layerFloatingBuffer, 'layer', layerId);
  }
}

export function startMoveFromPasted(imageData: ImageData, boundBox: { x: number; y: number; width: number; height: number }) {
  const layerId = activeLayer().id;
  cancelSelection();
  setToolStore('activeToolCategory', TOOL_CATEGORIES.MOVE);
  const pastingOffset = { x: 0, y: 0 };
  selectionManager.beginPreview('replace');
  selectionManager.setPreviewFragment({ kind: 'rect', startPosition: pastingOffset, width: boundBox.width, height: boundBox.height });
  selectionManager.commit();
  floatingMoveManager.startMove(
    {
      buffer: new Uint8ClampedArray(imageData.data),
      width: boundBox.width,
      height: boundBox.height,
      offset: pastingOffset,
      origin: { x: boundBox.x, y: boundBox.y },
    },
    'pasted',
    layerId
  );
}

export function getSelectionOffset() {
  return floatingMoveManager.isMoving() ? floatingMoveManager.getFloatingBuffer()!.offset : selectionManager.getAreaOffset();
}

export function cancelSelection() {
  const layerId = floatingMoveManager.getTargetLayerId() ?? undefined;
  const wasMoving = floatingMoveManager.isMoving();
  const hadSelection = selectionManager.isSelected();
  if (wasMoving) {
    floatingMoveManager.cancel();
  }
  selectionManager.clear();

  updateWebGLCanvas('selection cancelled');
  updateLayerPreview(layerId);

  if (wasMoving || hadSelection) {
    logUserInfo('Selection cancelled.');
  }
}

export function commitMove() {
  const wasMoving = floatingMoveManager.isMoving();
  floatingMoveManager.commit();
  if (wasMoving) {
    logUserInfo('Selection move committed.');
  }
}

export function cancelMove() {
  const layerId = floatingMoveManager.getTargetLayerId() ?? undefined;
  const wasMoving = floatingMoveManager.isMoving();
  floatingMoveManager.cancel();

  updateWebGLCanvas('move cancelled');
  updateLayerPreview(layerId);

  if (wasMoving) {
    logUserInfo('Selection move cancelled.');
  }
}

export function deleteSelectedArea(props?: { layerId?: string; noAction?: boolean }): Uint8ClampedArray | undefined {
  const selection = getCurrentSelection();
  const lid = props?.layerId ?? activeLayer().id;
  const width = projectStore.canvas.size.width;
  const height = projectStore.canvas.size.height;

  const bBox = selection.getBoundBox();
  if (!bBox) {
    logUserWarn('No selection to delete.');
    return;
  }
  const layer = layerManager.getLayerOptional(lid);
  if (!layer) return;
  const mask = selection.getMask();
  const bounds = {
    x: bBox.left,
    y: bBox.top,
    width: bBox.right - bBox.left + 1,
    height: bBox.bottom - bBox.top + 1,
  };
  const glBounds = {
    x: bounds.x,
    y: height - bounds.y - bounds.height,
    width: bounds.width,
    height: bounds.height,
  };
  const maskTexture = buildSelectionMaskTexture(layer, mask, width, height);
  if (!maskTexture) return;

  if (!props?.noAction) {
    layer.commitHistory(glBounds);
  }
  layer.applyEffectWithTextures({ fragmentSrc: CLEAR_WITH_MASK_300ES }, { u_mask: maskTexture }, glBounds);
  deleteTexture(layer.getGLContext(), maskTexture);

  updateWebGLCanvas('delete selected area');
  updateLayerPreview(lid);
  logUserInfo('Selected area cleared.');

  if (!props?.noAction) {
    const acc = new LayerHistoryAction({ layerId: lid, context: { tool: TOOL_CATEGORIES.RECT_SELECTION } });
    projectHistoryController.addAction(acc);
  }
  return layerManager.exportRawCanvas(lid);
}

export function invertSelectionArea() {
  // 1) 移動中なら見た目どおりに反映してから反転
  selectionManager.commitOffset();

  // 2) プレビュー中の内容は混ぜない（明示的に確定していないため）
  if (selectionManager.getPreviewMask()) {
    selectionManager.cancelPreview();
  }

  const selection = getCurrentSelection();
  const mask = selection.getMask();
  if (!mask || mask.length === 0) {
    logUserWarn('No selection to invert.');
    return;
  }

  // 3) すべて 1 のマスクから現在のマスクを減算して反転を得る
  //    out = 1 & ~mask == ~mask
  let ones: Uint8Array | null = new Uint8Array(mask.length).fill(1);
  const inverted = new Uint8Array(combine_masks_subtract(ones, mask));

  ones = null;
  selection.setMask(inverted);

  // 4) 状態更新とイベント発火
  selectionManager.setState(isSelectionAvailable() ? 'selected' : 'idle');

  eventBus.emit('selection:updateSelectionMenu', { immediate: true });
  eventBus.emit('selection:updateSelectionPath', { immediate: true });
  logUserInfo('Selection inverted.');
}

// Compute tight bounding box of 1s in a canvas-sized selection mask
export const computeMaskBBox = (
  mask: Uint8Array,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } | undefined => {
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

export function getCurrentSelectionBuffer():
  | {
      buffer: Uint8ClampedArray;
      bbox: { x: number; y: number; width: number; height: number };
    }
  | undefined {
  const width = projectStore.canvas.size.width;
  const height = projectStore.canvas.size.height;
  selectionManager.commitOffset();
  const mask = selectionManager.getCombinedMask();
  const bbox = computeMaskBBox(mask, width, height);
  if (!bbox) return;

  const trimmedMask = trim_mask_with_box(mask, width, height, bbox.x, bbox.y, bbox.width, bbox.height);
  const sourceBuffer = layerManager.exportRawCanvas(activeLayer().id);
  const selectionBuffer = extractMaskedPatch(sourceBuffer, trimmedMask, width, height, bbox.x, bbox.y, bbox.width, bbox.height);

  return {
    buffer: selectionBuffer,
    bbox,
  };
}

export async function convertSelectionToImage(deleteAfter?: boolean) {
  const selectionData = getCurrentSelectionBuffer();
  if (!selectionData) return;
  const { buffer, bbox } = selectionData;

  const oldEntries = imagePoolStore.entries.slice();
  const oldImages = clonePersistedImages(toPersistedImages(imagePoolStore.images));

  const { entry, image } = await createEntryFromRawBuffer(buffer, bbox.width, bbox.height);
  entry.descriptionName = '[ from selection ]';
  entry.transform.x = bbox.x;
  entry.transform.y = bbox.y;
  entry.transform.scaleX = 1;
  entry.transform.scaleY = 1;

  insertEntry(entry, image, true);
  selectEntry(entry.id);

  const newEntries = imagePoolStore.entries.slice();
  const newImages = clonePersistedImages(toPersistedImages(imagePoolStore.images));

  let beforeSnapshot = undefined;
  let afterSnapshot = undefined;
  if (deleteAfter) {
    beforeSnapshot = getPackedLayerSnapshot(layerListStore.activeLayerId);
    deleteSelectedArea({ noAction: true });
    afterSnapshot = getPackedLayerSnapshot(layerListStore.activeLayerId);
  }
  cancelSelection();

  const action = new ConvertSelectionHistoryAction({
    layerId: layerListStore.activeLayerId,
    oldEntries,
    newEntries,
    oldImages,
    newImages,
    beforeSnapshot,
    afterSnapshot,
  });
  projectHistoryController.addAction(action);

  selectionManager.setState(isSelectionAvailable() ? 'selected' : 'idle');

  eventBus.emit('selection:updateSelectionMenu', { immediate: true });
  eventBus.emit('selection:updateSelectionPath', { immediate: true });

  if (deleteAfter) {
    updateWebGLCanvas('delete selected area');
    updateLayerPreview(layerListStore.activeLayerId);
  }
}

function buildSelectionMaskTexture(layer: ReturnType<typeof layerManager.getLayerOptional>, mask: Uint8Array, width: number, height: number) {
  if (!layer) return;
  const expected = width * height;
  if (mask.length !== expected) return;
  const rgba = new Uint8ClampedArray(expected * 4);
  for (let i = 0; i < expected; i++) {
    const v = mask[i] ? 255 : 0;
    const idx = i * 4;
    rgba[idx] = v;
    rgba[idx + 3] = 255;
  }
  flip_pixels_vertically(new Uint8Array(rgba.buffer), width, height);
  const texture = createTexture(layer.getGLContext(), width, height, new Uint8Array(rgba.buffer));
  return texture;
}

function extractMaskedPatch(
  source: Uint8ClampedArray,
  mask: Uint8Array,
  sourceWidth: number,
  sourceHeight: number,
  left: number,
  top: number,
  width: number,
  height: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcY = top + y;
    if (srcY < 0 || srcY >= sourceHeight) continue;
    for (let x = 0; x < width; x++) {
      const srcX = left + x;
      if (srcX < 0 || srcX >= sourceWidth) continue;
      const maskIdx = y * width + x;
      if (mask[maskIdx] === 0) continue;
      const srcIdx = (srcY * sourceWidth + srcX) * 4;
      const dstIdx = (y * width + x) * 4;
      out[dstIdx] = source[srcIdx];
      out[dstIdx + 1] = source[srcIdx + 1];
      out[dstIdx + 2] = source[srcIdx + 2];
      out[dstIdx + 3] = source[srcIdx + 3];
    }
  }
  return out;
}

const CLEAR_WITH_MASK_300ES = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_src;
uniform sampler2D u_mask;

void main() {
  vec4 src = texture(u_src, v_uv);
  float m = texture(u_mask, v_uv).r;
  if (m > 0.0) {
    outColor = vec4(0.0);
  } else {
    outColor = src;
  }
}
`;
