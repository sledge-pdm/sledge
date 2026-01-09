// replace things in @sledge/wasm in this file
// Doesn't require much optimization because we just testing how this memory-leaking-situation changes after purging @sledge/wasm

type Point = { x: number; y: number };
type Segment = { p1: Point; p2: Point };

export function combine_masks_add(base_mask: Uint8Array, preview_mask: Uint8Array): Uint8Array {
  const result = base_mask.slice();
  const len = Math.min(result.length, preview_mask.length);
  for (let i = 0; i < len; i++) {
    result[i] |= preview_mask[i];
  }
  return result;
}

export function combine_masks_subtract(base_mask: Uint8Array, preview_mask: Uint8Array): Uint8Array {
  const result = base_mask.slice();
  const len = Math.min(result.length, preview_mask.length);
  for (let i = 0; i < len; i++) {
    result[i] &= preview_mask[i] ^ 1;
  }
  return result;
}

export function combine_masks_replace(preview_mask: Uint8Array): Uint8Array {
  return preview_mask.slice();
}

export function fill_rect_mask(
  mask: Uint8Array,
  width: number,
  height: number,
  start_x: number,
  start_y: number,
  rect_width: number,
  rect_height: number
): void {
  const w = width | 0;
  const h = height | 0;
  const maxX = Math.min(w, start_x + rect_width);
  const maxY = Math.min(h, start_y + rect_height);
  for (let y = Math.max(0, start_y); y < maxY; y++) {
    for (let x = Math.max(0, start_x); x < maxX; x++) {
      const idx = y * w + x;
      if (idx >= 0 && idx < mask.length) {
        mask[idx] = 1;
      }
    }
  }
}

export function apply_mask_offset(mask: Uint8Array, width: number, height: number, offset_x: number, offset_y: number): Uint8Array {
  const w = width | 0;
  const h = height | 0;
  const result = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const oldIdx = y * w + x;
      if (oldIdx < mask.length && mask[oldIdx] === 1) {
        const newX = x + offset_x;
        const newY = y + offset_y;
        if (newX >= 0 && newX < w && newY >= 0 && newY < h) {
          const newIdx = newY * w + newX;
          if (newIdx < result.length) {
            result[newIdx] = 1;
          }
        }
      }
    }
  }
  return result;
}

export function trim_mask_with_box(
  mask: Uint8Array,
  mask_width: number,
  _mask_height: number,
  box_x: number,
  box_y: number,
  box_width: number,
  box_height: number
): Uint8Array {
  const mw = mask_width | 0;
  const bw = box_width | 0;
  const bh = box_height | 0;
  const result = new Uint8Array(bw * bh);
  const ox = box_x | 0;
  const oy = box_y | 0;

  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const bi = y * bw + x;
      const srcX = ox + x;
      const srcY = oy + y;
      const si = srcY * mw + srcX;
      if (si >= 0 && si < mask.length) {
        result[bi] = mask[si];
      }
    }
  }
  return result;
}

export function mask_to_path(mask: Uint8Array, width: number, height: number, offset_x: number, offset_y: number): string {
  const w = width | 0;
  const h = height | 0;
  if (w <= 0 || h <= 0) return '';

  const segments = merge_segments(extract_boundary_segments(mask, w, h));
  const loops = build_loops(segments);

  const parts: string[] = [];
  for (const loop of loops) {
    for (let i = 0; i < loop.length; i++) {
      const pt = loop[i];
      const x = pt.x + offset_x;
      const y = pt.y + offset_y;
      parts.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    parts.push('Z');
  }
  return parts.join(' ');
}

function extract_boundary_segments(mask: Uint8Array, w: number, h: number): Segment[] {
  const keySet = new Map<string, Segment>();

  const addOrRemove = (a: Point, b: Point) => {
    let p1 = a;
    let p2 = b;
    if (p1.x > p2.x || (p1.x === p2.x && p1.y > p2.y)) {
      const tmp = p1;
      p1 = p2;
      p2 = tmp;
    }
    const key = `${p1.x},${p1.y}-${p2.x},${p2.y}`;
    if (keySet.has(key)) {
      keySet.delete(key);
    } else {
      keySet.set(key, { p1, p2 });
    }
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (idx >= mask.length || mask[idx] === 0) continue;

      if (y === 0 || mask[(y - 1) * w + x] === 0) {
        addOrRemove({ x, y }, { x: x + 1, y });
      }
      if (y === h - 1 || mask[(y + 1) * w + x] === 0) {
        addOrRemove({ x: x + 1, y: y + 1 }, { x, y: y + 1 });
      }
      if (x === 0 || mask[y * w + x - 1] === 0) {
        addOrRemove({ x, y: y + 1 }, { x, y });
      }
      if (x === w - 1 || mask[y * w + x + 1] === 0) {
        addOrRemove({ x: x + 1, y }, { x: x + 1, y: y + 1 });
      }
    }
  }

  return Array.from(keySet.values());
}

function merge_segments(segs: Segment[]): Segment[] {
  const horiz: Segment[] = [];
  const vert: Segment[] = [];

  for (const s of segs) {
    if (s.p1.y === s.p2.y) {
      horiz.push(order_horizontal(s));
    } else {
      vert.push(order_vertical(s));
    }
  }

  const result: Segment[] = [];

  const horizGroups = new Map<number, Segment[]>();
  for (const seg of horiz) {
    const list = horizGroups.get(seg.p1.y) ?? [];
    list.push(seg);
    horizGroups.set(seg.p1.y, list);
  }
  for (const group of horizGroups.values()) {
    result.push(...merge_line(group, true));
  }

  const vertGroups = new Map<number, Segment[]>();
  for (const seg of vert) {
    const list = vertGroups.get(seg.p1.x) ?? [];
    list.push(seg);
    vertGroups.set(seg.p1.x, list);
  }
  for (const group of vertGroups.values()) {
    result.push(...merge_line(group, false));
  }

  return result;
}

function order_horizontal(s: Segment): Segment {
  if (s.p1.x <= s.p2.x) return s;
  return { p1: s.p2, p2: s.p1 };
}

function order_vertical(s: Segment): Segment {
  if (s.p1.y <= s.p2.y) return s;
  return { p1: s.p2, p2: s.p1 };
}

function merge_line(list: Segment[], is_horizontal: boolean): Segment[] {
  if (list.length === 0) return [];

  if (is_horizontal) {
    list.sort((a, b) => a.p1.x - b.p1.x);
  } else {
    list.sort((a, b) => a.p1.y - b.p1.y);
  }

  const result: Segment[] = [];
  let current: Segment = { p1: { ...list[0].p1 }, p2: { ...list[0].p2 } };

  for (const seg of list.slice(1)) {
    const canMerge = is_horizontal ? current.p2.x >= seg.p1.x : current.p2.y >= seg.p1.y;
    if (canMerge) {
      if (is_horizontal) {
        current.p2.x = Math.max(current.p2.x, seg.p2.x);
      } else {
        current.p2.y = Math.max(current.p2.y, seg.p2.y);
      }
    } else {
      result.push(current);
      current = { p1: { ...seg.p1 }, p2: { ...seg.p2 } };
    }
  }

  result.push(current);
  return result;
}

function build_loops(segs: Segment[]): Point[][] {
  const used = new Set<string>();
  const idxByPt = new Map<string, Segment[]>();

  for (const seg of segs) {
    for (const pt of [seg.p1, seg.p2]) {
      const key = `${pt.x},${pt.y}`;
      const list = idxByPt.get(key) ?? [];
      list.push(seg);
      idxByPt.set(key, list);
    }
  }

  const loops: Point[][] = [];

  for (const s0 of segs) {
    const id0 = seg_key(s0.p1, s0.p2);
    if (used.has(id0)) continue;

    const loopPoints: Point[] = [s0.p1, s0.p2];
    used.add(id0);

    let prev = s0.p1;
    let cur = s0.p2;

    for (;;) {
      const curKey = `${cur.x},${cur.y}`;
      const candidates = idxByPt.get(curKey) ?? [];
      const next = candidates.find((s) => !used.has(seg_key(s.p1, s.p2)) && !points_equal(s, prev));

      if (!next) break;

      used.add(seg_key(next.p1, next.p2));
      const nextPt = same_point(next.p1, cur) ? next.p2 : next.p1;
      loopPoints.push(nextPt);
      prev = cur;
      cur = nextPt;

      if (same_point(cur, loopPoints[0])) break;
    }

    loops.push(loopPoints);
  }

  return loops;
}

function seg_key(a: Point, b: Point): string {
  return `${a.x},${a.y}-${b.x},${b.y}`;
}

function points_equal(s: Segment, pt: Point): boolean {
  return same_point(s.p1, pt) || same_point(s.p2, pt);
}

function same_point(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}
