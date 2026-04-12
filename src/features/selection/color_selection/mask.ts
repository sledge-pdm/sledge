import type { RGBA } from '@sledge-pdm/core';
import type { ColorSelectionMode } from './types';

export function selectColorRangeMask(
  buffer: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  targetColor: RGBA,
  threshold: number
): Uint8Array {
  const pixelCount = width * height;
  const mask = new Uint8Array(pixelCount);
  if (pixelCount === 0) return mask;

  const [tr, tg, tb, ta] = targetColor;
  const normalizedThreshold = Math.max(0, Math.min(255, Math.round(threshold)));

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = buffer[idx] ?? 0;
    const g = buffer[idx + 1] ?? 0;
    const b = buffer[idx + 2] ?? 0;
    const a = buffer[idx + 3] ?? 0;

    if (normalizedThreshold === 0) {
      if (r === tr && g === tg && b === tb && a === ta) {
        mask[i] = 1;
      }
      continue;
    }

    // When threshold > 0, only RGB channels are compared; alpha is intentionally
    // excluded so that partially transparent pixels with matching colors are selected.
    if (Math.abs(r - tr) <= normalizedThreshold && Math.abs(g - tg) <= normalizedThreshold && Math.abs(b - tb) <= normalizedThreshold) {
      mask[i] = 1;
    }
  }

  return mask;
}

export function hasMaskPixels(mask: Uint8Array): boolean {
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] !== 0) return true;
  }
  return false;
}

export function mergeSelectionMasks(baseMask: Uint8Array | undefined, nextMask: Uint8Array, mode: ColorSelectionMode): Uint8Array {
  if (mode === 'replace') {
    return new Uint8Array(nextMask);
  }

  const merged = new Uint8Array(nextMask.length);
  if (baseMask && baseMask.length === nextMask.length) {
    merged.set(baseMask);
  }

  if (mode === 'add') {
    for (let i = 0; i < nextMask.length; i++) {
      if (nextMask[i] === 1) merged[i] = 1;
    }
    return merged;
  }

  for (let i = 0; i < nextMask.length; i++) {
    if (nextMask[i] === 1) merged[i] = 0;
  }
  return merged;
}

export function readColorFromBuffer(buffer: Uint8Array | Uint8ClampedArray, width: number, height: number, x: number, y: number): RGBA | undefined {
  if (x < 0 || y < 0 || x >= width || y >= height) return undefined;
  const idx = (y * width + x) * 4;
  return [buffer[idx] ?? 0, buffer[idx + 1] ?? 0, buffer[idx + 2] ?? 0, buffer[idx + 3] ?? 0];
}
