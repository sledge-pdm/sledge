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

export function fill_mask_area(
  buffer: Uint8Array,
  mask: Uint8Array,
  fill_color_r: number,
  fill_color_g: number,
  fill_color_b: number,
  fill_color_a: number
): boolean {
  const pixels = Math.min(mask.length, Math.floor(buffer.length / 4));
  for (let i = 0; i < pixels; i++) {
    if (!mask[i]) continue;
    const bi = i * 4;
    buffer[bi] = fill_color_r;
    buffer[bi + 1] = fill_color_g;
    buffer[bi + 2] = fill_color_b;
    buffer[bi + 3] = fill_color_a;
  }
  return true;
}

export function scanline_flood_fill(
  buffer: Uint8Array,
  width: number,
  height: number,
  start_x: number,
  start_y: number,
  fill_color_r: number,
  fill_color_g: number,
  fill_color_b: number,
  fill_color_a: number,
  threshold: number
): boolean {
  if (start_x < 0 || start_y < 0 || start_x >= width || start_y >= height) return false;

  const startIndex = (start_y * width + start_x) * 4;
  const tr = buffer[startIndex] ?? 0;
  const tg = buffer[startIndex + 1] ?? 0;
  const tb = buffer[startIndex + 2] ?? 0;
  const ta = buffer[startIndex + 3] ?? 0;

  if (threshold === 255) {
    const pixels = width * height;
    for (let i = 0; i < pixels; i++) {
      const idx = i * 4;
      buffer[idx] = fill_color_r;
      buffer[idx + 1] = fill_color_g;
      buffer[idx + 2] = fill_color_b;
      buffer[idx + 3] = fill_color_a;
    }
    return true;
  }

  const visited = new Uint8Array(width * height);
  const stackX: number[] = [start_x];
  const stackY: number[] = [start_y];

  while (stackX.length) {
    const x = stackX.pop()!;
    const y = stackY.pop()!;
    if (x < 0 || y < 0 || x >= width || y >= height) continue;

    const flat = y * width + x;
    if (visited[flat]) continue;

    const pi = flat * 4;
    const cr = buffer[pi] ?? 0;
    const cg = buffer[pi + 1] ?? 0;
    const cb = buffer[pi + 2] ?? 0;
    const ca = buffer[pi + 3] ?? 0;
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
      const si = f * 4;
      buffer[si] = fill_color_r;
      buffer[si + 1] = fill_color_g;
      buffer[si + 2] = fill_color_b;
      buffer[si + 3] = fill_color_a;
    }

    for (let scanX = left; scanX <= right; scanX++) {
      if (y > 0) {
        const upY = y - 1;
        const upF = upY * width + scanX;
        if (!visited[upF]) {
          const ui = upF * 4;
          const ur = buffer[ui] ?? 0;
          const ug = buffer[ui + 1] ?? 0;
          const ub = buffer[ui + 2] ?? 0;
          const ua = buffer[ui + 3] ?? 0;
          if (colors_match(ur, ug, ub, ua, tr, tg, tb, ta, threshold)) {
            stackX.push(scanX);
            stackY.push(upY);
          }
        }
      }

      if (y + 1 < height) {
        const downY = y + 1;
        const downF = downY * width + scanX;
        if (!visited[downF]) {
          const di = downF * 4;
          const dr = buffer[di] ?? 0;
          const dg = buffer[di + 1] ?? 0;
          const db = buffer[di + 2] ?? 0;
          const da = buffer[di + 3] ?? 0;
          if (colors_match(dr, dg, db, da, tr, tg, tb, ta, threshold)) {
            stackX.push(scanX);
            stackY.push(downY);
          }
        }
      }
    }
  }

  return true;
}

export function scanline_flood_fill_with_mask(
  buffer: Uint8Array,
  width: number,
  height: number,
  start_x: number,
  start_y: number,
  fill_color_r: number,
  fill_color_g: number,
  fill_color_b: number,
  fill_color_a: number,
  threshold: number,
  selection_mask: Uint8Array,
  limit_mode: string
): boolean {
  if (start_x < 0 || start_y < 0 || start_x >= width || start_y >= height) return false;

  const isAllowed = (x: number, y: number): boolean => {
    const idx = y * width + x;
    const isSelected = selection_mask[idx] === 1;
    if (limit_mode === 'inside') return isSelected;
    if (limit_mode === 'outside') return !isSelected;
    return true;
  };

  const startIndex = (start_y * width + start_x) * 4;
  const tr = buffer[startIndex] ?? 0;
  const tg = buffer[startIndex + 1] ?? 0;
  const tb = buffer[startIndex + 2] ?? 0;
  const ta = buffer[startIndex + 3] ?? 0;

  if (threshold === 255) {
    const pixels = width * height;
    for (let i = 0; i < pixels; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      if (!isAllowed(x, y)) continue;
      const idx = i * 4;
      buffer[idx] = fill_color_r;
      buffer[idx + 1] = fill_color_g;
      buffer[idx + 2] = fill_color_b;
      buffer[idx + 3] = fill_color_a;
    }
    return true;
  }

  const visited = new Uint8Array(width * height);
  const stackX: number[] = [start_x];
  const stackY: number[] = [start_y];

  while (stackX.length) {
    const x = stackX.pop()!;
    const y = stackY.pop()!;
    if (x < 0 || y < 0 || x >= width || y >= height) continue;

    const flat = y * width + x;
    if (visited[flat]) continue;
    visited[flat] = 1;

    if (!isAllowed(x, y)) continue;

    const pi = flat * 4;
    const cr = buffer[pi] ?? 0;
    const cg = buffer[pi + 1] ?? 0;
    const cb = buffer[pi + 2] ?? 0;
    const ca = buffer[pi + 3] ?? 0;
    if (!colors_match(cr, cg, cb, ca, tr, tg, tb, ta, threshold)) continue;

    let left = x;
    let right = x;

    while (left > 0 && isAllowed(left - 1, y)) {
      const lf = y * width + (left - 1);
      const li = lf * 4;
      const lr = buffer[li] ?? 0;
      const lg = buffer[li + 1] ?? 0;
      const lb = buffer[li + 2] ?? 0;
      const la = buffer[li + 3] ?? 0;
      if (colors_match(lr, lg, lb, la, tr, tg, tb, ta, threshold)) {
        left -= 1;
        visited[y * width + left] = 1;
      } else {
        break;
      }
    }

    while (right + 1 < width && isAllowed(right + 1, y)) {
      const rf = y * width + (right + 1);
      const ri = rf * 4;
      const rr = buffer[ri] ?? 0;
      const rg = buffer[ri + 1] ?? 0;
      const rb = buffer[ri + 2] ?? 0;
      const ra = buffer[ri + 3] ?? 0;
      if (colors_match(rr, rg, rb, ra, tr, tg, tb, ta, threshold)) {
        right += 1;
        visited[y * width + right] = 1;
      } else {
        break;
      }
    }

    for (let scanX = left; scanX <= right; scanX++) {
      const si = (y * width + scanX) * 4;
      buffer[si] = fill_color_r;
      buffer[si + 1] = fill_color_g;
      buffer[si + 2] = fill_color_b;
      buffer[si + 3] = fill_color_a;
    }

    for (let scanX = left; scanX <= right; scanX++) {
      if (y > 0) {
        const upY = y - 1;
        const upFlat = upY * width + scanX;
        if (!visited[upFlat] && isAllowed(scanX, upY)) {
          const ui = upFlat * 4;
          const ur = buffer[ui] ?? 0;
          const ug = buffer[ui + 1] ?? 0;
          const ub = buffer[ui + 2] ?? 0;
          const ua = buffer[ui + 3] ?? 0;
          if (colors_match(ur, ug, ub, ua, tr, tg, tb, ta, threshold)) {
            stackX.push(scanX);
            stackY.push(upY);
          }
        }
      }

      if (y + 1 < height) {
        const downY = y + 1;
        const downFlat = downY * width + scanX;
        if (!visited[downFlat] && isAllowed(scanX, downY)) {
          const di = downFlat * 4;
          const dr = buffer[di] ?? 0;
          const dg = buffer[di + 1] ?? 0;
          const db = buffer[di + 2] ?? 0;
          const da = buffer[di + 3] ?? 0;
          if (colors_match(dr, dg, db, da, tr, tg, tb, ta, threshold)) {
            stackX.push(scanX);
            stackY.push(downY);
          }
        }
      }
    }
  }

  return true;
}
