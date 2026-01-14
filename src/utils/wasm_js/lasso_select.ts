// replace things in @sledge/wasm in this file
// Doesn't require much optimization because we just testing how this memory-leaking-situation changes after purging @sledge/wasm

export function fill_lasso_selection(mask: Uint8Array, width: number, height: number, points: Float32Array, fill_rule: string): boolean {
  const w = width | 0;
  const h = height | 0;
  if (points.length < 6 || points.length % 2 !== 0) return false;

  const bounds = calculate_bounds(points);
  const start_x = Math.max(0, Math.min(w, Math.floor(bounds.minX) - 1));
  const end_x = Math.max(0, Math.min(w, Math.ceil(bounds.maxX) + 2));
  const start_y = Math.max(0, Math.min(h, Math.floor(bounds.minY) - 1));
  const end_y = Math.max(0, Math.min(h, Math.ceil(bounds.maxY) + 2));

  if (fill_rule === 'nonzero') {
    for (let y = start_y; y < end_y; y++) {
      const intersections = find_intersections_with_direction(points, y);
      fill_scanline_mask_nonzero(mask, w, y, intersections, start_x, end_x);
    }
  } else {
    for (let y = start_y; y < end_y; y++) {
      const intersections = find_intersections(points, y);
      fill_scanline_mask(mask, w, y, intersections, start_x, end_x);
    }
  }

  return true;
}

function calculate_bounds(points: Float32Array): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return { minX, maxX, minY, maxY };
}

function find_intersections(points: Float32Array, y: number): number[] {
  const intersections: number[] = [];
  const n = points.length / 2;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const x1 = points[i * 2];
    const y1 = points[i * 2 + 1];
    const x2 = points[j * 2];
    const y2 = points[j * 2 + 1];

    const dy = y2 - y1;
    if (((y1 <= y && y < y2) || (y2 <= y && y < y1)) && Math.abs(dy) > Number.EPSILON) {
      const x = x1 + ((y - y1) * (x2 - x1)) / dy;
      intersections.push(x);
    }
  }

  intersections.sort((a, b) => a - b);
  return intersections;
}

function find_intersections_with_direction(points: Float32Array, y: number): Array<[number, number]> {
  const intersections: Array<[number, number]> = [];
  const n = points.length / 2;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const x1 = points[i * 2];
    const y1 = points[i * 2 + 1];
    const x2 = points[j * 2];
    const y2 = points[j * 2 + 1];

    const dy = y2 - y1;
    if (((y1 <= y && y < y2) || (y2 <= y && y < y1)) && Math.abs(dy) > Number.EPSILON) {
      const x = x1 + ((y - y1) * (x2 - x1)) / dy;
      const direction = y2 > y1 ? 1 : -1;
      intersections.push([x, direction]);
    }
  }

  intersections.sort((a, b) => a[0] - b[0]);
  return intersections;
}

function fill_scanline_mask(mask: Uint8Array, width: number, y: number, intersections: number[], start_x: number, end_x: number) {
  for (let i = 0; i + 1 < intersections.length; i += 2) {
    const left = Math.max(start_x, Math.min(width, Math.floor(intersections[i])));
    const right = Math.max(start_x, Math.min(end_x, Math.min(width, Math.ceil(intersections[i + 1]))));
    for (let x = left; x < right; x++) {
      if (x < width) {
        mask[y * width + x] = 1;
      }
    }
  }
}

function fill_scanline_mask_nonzero(
  mask: Uint8Array,
  width: number,
  y: number,
  intersections: Array<[number, number]>,
  start_x: number,
  end_x: number
) {
  let winding = 0;
  let last_x = start_x;

  for (const [x, direction] of intersections) {
    if (winding !== 0) {
      const fill_start = Math.max(start_x, Math.min(width, Math.floor(last_x)));
      const fill_end = Math.max(start_x, Math.min(end_x, Math.min(width, Math.floor(x))));
      for (let fill_x = fill_start; fill_x < fill_end; fill_x++) {
        if (fill_x < width) {
          mask[y * width + fill_x] = 1;
        }
      }
    }

    winding += direction;
    last_x = x;
  }

  if (winding !== 0) {
    const fill_start = Math.max(start_x, Math.min(width, Math.floor(last_x)));
    const fill_end = Math.min(end_x, width);
    for (let fill_x = fill_start; fill_x < fill_end; fill_x++) {
      if (fill_x < width) {
        mask[y * width + fill_x] = 1;
      }
    }
  }
}
