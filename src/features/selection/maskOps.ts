export function extractMaskedPatch(
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
