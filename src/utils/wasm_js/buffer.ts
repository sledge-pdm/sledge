// replace things in @sledge/wasm in this file
// Doesn't require much optimization because we just testing how this memory-leaking-situation changes after purging @sledge/wasm

export function flip_pixels_vertically(pixels: Uint8Array, width: number, height: number): void {
  const rowBytes = width * 4;
  if (rowBytes <= 0 || height <= 1) return;
  if (pixels.length < rowBytes * height) return;

  const tmp = new Uint8Array(rowBytes);
  const half = Math.floor(height / 2);
  for (let y = 0; y < half; y++) {
    const top = y * rowBytes;
    const bottom = (height - 1 - y) * rowBytes;
    tmp.set(pixels.subarray(top, top + rowBytes));
    pixels.copyWithin(top, bottom, bottom + rowBytes);
    pixels.set(tmp, bottom);
  }
}

export function create_opacity_mask(buffer: Uint8Array, width: number, height: number): Uint8Array {
  const totalPixels = width * height;
  const out = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const a = buffer[i * 4 + 3] ?? 0;
    out[i] = a > 0 ? 1 : 0;
  }
  return out;
}
