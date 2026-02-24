import { Vec2 } from '@sledge-pdm/core';
import { historyManager } from '~/features/history';
import { convertSelectionToImageSnippet } from '~/features/history/command/snippet/ConvertSelectionToImageCommands';
import { CommandsHistoryEntry } from '~/features/history/entry/CommandsHistoryEntry';
import { createEntryFromRawBuffer, insertEntry, selectEntry } from '~/features/image_pool';
import { activeLayer } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logUserInfo, logUserWarn } from '~/features/log/service';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { toolStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { createTexture, deleteTexture } from '~/utils/TextureUtils';
import { combine_masks_subtract, flip_pixels_vertically, trim_mask_with_box } from '~/utils/wasm';
import { updateFrascoCanvas } from '~/webgl/service';
import { extractMaskedPatch } from './maskOps';

// SelectionOperator is an integrated manager of selection area and floating move management.

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
    if (!selectionManager.hasSelection()) {
      // 選択範囲がない場合：制限なしとして扱う
      return true;
    }
  }
  const isInSelection = isPositionWithinSelection(pos);
  if (limitMode === 'inside') {
    // 選択範囲内のみ描画可能
    return isInSelection;
  } else if (limitMode === 'outside') {
    // 選択範囲外のみ描画可能
    return !isInSelection;
  }

  return true;
}

export function isPositionWithinSelection(pos: Vec2): boolean {
  const selection = selectionManager.getSelection();
  const offset = selectionManager.getOffset();
  if (!selection) return false;
  return (
    selection.get({
      x: Math.floor(pos.x - offset.x),
      y: Math.floor(pos.y - offset.y),
    }) !== 0
  );
}

export function cancelSelection() {
  const wasMoving = floatingMoveManager.isMoving();
  const hadSelection = selectionManager.hasSelection();
  if (wasMoving) {
    floatingMoveManager.cancel();
  }
  selectionManager.clearAll();

  updateFrascoCanvas('selection cancelled');

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
  const wasMoving = floatingMoveManager.isMoving();
  floatingMoveManager.cancel();

  updateFrascoCanvas('move cancelled');

  if (wasMoving) {
    logUserInfo('Selection move cancelled.');
  }
}

export function deleteSelectedArea(props?: { layerId?: string; noAction?: boolean }): Uint8ClampedArray | undefined {
  const selection = selectionManager.getBack();
  if (!selection) return;
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

  if (props?.noAction) {
    layer.commitHistory(glBounds, { silent: true });
  } else {
    layer.commitHistory(glBounds, { context: { tool: TOOL_CATEGORIES.RECT_SELECTION } });
  }
  layer.applyEffectWithTextures({ fragmentSrc: CLEAR_WITH_MASK_300ES }, { u_mask: maskTexture }, glBounds);
  deleteTexture(layer.getGLContext(), maskTexture);

  updateFrascoCanvas('delete selected area');
  logUserInfo('Selected area cleared.');

  return layerManager.exportRawCanvas(lid);
}

export function invertSelectionArea() {
  selectionManager.commitOffset();
  const selection = selectionManager.getBack();
  const mask = selection?.getMask();
  if (!selection || !mask || mask.length === 0) {
    logUserWarn('No selection to invert.');
    return;
  }

  // 3) すべて 1 のマスクから現在のマスクを減算して反転を得る
  //    out = 1 & ~mask == ~mask
  let ones: Uint8Array | null = new Uint8Array(mask.length).fill(1);
  const inverted = new Uint8Array(combine_masks_subtract(ones, mask));

  ones = null;
  selection.setMask(inverted);
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
  const mask = selectionManager.getSelection()?.getMask();
  if (!mask) return;
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

  const selectionBefore = selectionManager.getSelection();

  const { entry, image } = await createEntryFromRawBuffer(buffer, bbox.width, bbox.height);
  entry.descriptionName = '[ from selection ]';
  entry.transform.x = bbox.x;
  entry.transform.y = bbox.y;
  entry.transform.scaleX = 1;
  entry.transform.scaleY = 1;

  insertEntry(entry, image, { register: false });
  selectEntry(entry.id);

  if (deleteAfter) {
    deleteSelectedArea({ noAction: true });
  }
  cancelSelection();

  const entryIndex = projectStore.imagePool.entries.findIndex((item) => item.id === entry.id);
  const { commands, context } = convertSelectionToImageSnippet({
    entry,
    image,
    index: entryIndex,
    layerId: projectStore.layers.state.activeLayerId,
    selectionBefore,
    deleteAfter,
  });
  historyManager.addEntry(new CommandsHistoryEntry(commands, context));

  if (deleteAfter) {
    updateFrascoCanvas('delete selected area');
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
