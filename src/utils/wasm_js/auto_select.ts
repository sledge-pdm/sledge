// replace things in @sledge/wasm in this file
// Doesn't require much optimization because we just testing how this memory-leaking-situation changes after purging @sledge/wasm

function colors_match(
  c1r: number,
  c1g: number,
  c1b: number,
  c1a: number,
  c2r: number,
  c2g: number,
  c2b: number,
  c2a: number,
  threshold: number
): boolean {
  if (threshold === 0) {
    return c1r === c2r && c1g === c2g && c1b === c2b && c1a === c2a;
  }
  return Math.abs(c1r - c2r) <= threshold && Math.abs(c1g - c2g) <= threshold && Math.abs(c1b - c2b) <= threshold;
}

export function auto_select_region_mask(
  buffer: Uint8Array,
  width: number,
  height: number,
  start_x: number,
  start_y: number,
  threshold: number,
  _connectivity: number
): Uint8Array {
  if (width <= 0 || height <= 0) return new Uint8Array(0);
  if (start_x < 0 || start_y < 0 || start_x >= width || start_y >= height) return new Uint8Array(width * height);
  if (threshold === 255) return new Uint8Array(width * height).fill(1);

  const si = (start_y * width + start_x) * 4;
  const tr = buffer[si] ?? 0;
  const tg = buffer[si + 1] ?? 0;
  const tb = buffer[si + 2] ?? 0;
  const ta = buffer[si + 3] ?? 0;

  const mask = new Uint8Array(width * height);
  const visited = new Uint8Array(width * height);
  const stackX: number[] = [start_x];
  const stackY: number[] = [start_y];

  while (stackX.length) {
    const x = stackX.pop()!;
    const y = stackY.pop()!;
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const flat = y * width + x;
    if (visited[flat]) continue;

    const idx = flat * 4;
    const cr = buffer[idx] ?? 0;
    const cg = buffer[idx + 1] ?? 0;
    const cb = buffer[idx + 2] ?? 0;
    const ca = buffer[idx + 3] ?? 0;
    if (!colors_match(cr, cg, cb, ca, tr, tg, tb, ta, threshold)) continue;

    let left = x;
    let right = x;

    while (left > 0) {
      const lf = y * width + (left - 1);
      if (visited[lf]) break;
      const li = lf * 4;
      const lr = buffer[li] ?? 0;
      const lg = buffer[li + 1] ?? 0;
      const lb = buffer[li + 2] ?? 0;
      const la = buffer[li + 3] ?? 0;
      if (colors_match(lr, lg, lb, la, tr, tg, tb, ta, threshold)) left -= 1;
      else break;
    }

    while (right + 1 < width) {
      const rf = y * width + (right + 1);
      if (visited[rf]) break;
      const ri = rf * 4;
      const rr = buffer[ri] ?? 0;
      const rg = buffer[ri + 1] ?? 0;
      const rb = buffer[ri + 2] ?? 0;
      const ra = buffer[ri + 3] ?? 0;
      if (colors_match(rr, rg, rb, ra, tr, tg, tb, ta, threshold)) right += 1;
      else break;
    }

    for (let scanX = left; scanX <= right; scanX++) {
      const f = y * width + scanX;
      visited[f] = 1;
      mask[f] = 1;
    }

    if (y > 0) {
      const upY = y - 1;
      for (let scanX = left; scanX <= right; scanX++) {
        const f = upY * width + scanX;
        if (visited[f]) continue;
        const i = f * 4;
        const ur = buffer[i] ?? 0;
        const ug = buffer[i + 1] ?? 0;
        const ub = buffer[i + 2] ?? 0;
        const ua = buffer[i + 3] ?? 0;
        if (colors_match(ur, ug, ub, ua, tr, tg, tb, ta, threshold)) {
          stackX.push(scanX);
          stackY.push(upY);
        }
      }
    }

    if (y + 1 < height) {
      const downY = y + 1;
      for (let scanX = left; scanX <= right; scanX++) {
        const f = downY * width + scanX;
        if (visited[f]) continue;
        const i = f * 4;
        const dr = buffer[i] ?? 0;
        const dg = buffer[i + 1] ?? 0;
        const db = buffer[i + 2] ?? 0;
        const da = buffer[i + 3] ?? 0;
        if (colors_match(dr, dg, db, da, tr, tg, tb, ta, threshold)) {
          stackX.push(scanX);
          stackY.push(downY);
        }
      }
    }
  }

  return mask;
}
