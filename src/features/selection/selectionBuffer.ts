import { trim_mask_with_box } from '~/utils/wasm';
import { extractMaskedPatch } from './maskOps';

export interface SelectionBufferBBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Compute tight bounding box of 1s in a canvas-sized selection mask.
export const computeMaskBBox = (mask: Uint8Array, width: number, height: number): SelectionBufferBBox | undefined => {
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

export function extractSelectionBufferFromMask(
  sourceBuffer: Uint8ClampedArray,
  mask: Uint8Array,
  width: number,
  height: number,
  bbox?: SelectionBufferBBox
): { buffer: Uint8ClampedArray; bbox: SelectionBufferBBox } | undefined {
  const targetBBox = bbox ?? computeMaskBBox(mask, width, height);
  if (!targetBBox) return undefined;

  const trimmedMask = trim_mask_with_box(mask, width, height, targetBBox.x, targetBBox.y, targetBBox.width, targetBBox.height);
  const buffer = extractMaskedPatch(sourceBuffer, trimmedMask, width, height, targetBBox.x, targetBBox.y, targetBBox.width, targetBBox.height);
  return { buffer, bbox: targetBBox };
}
