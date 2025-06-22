import { Vec2 } from '~/models/types/Vector';
import { PathCmd, PathCmdList } from './PathCommand';

// 座標型
type Point = { x: number; y: number };
// 直線セグメント型
type Segment = { p1: Point; p2: Point };

/**
 * メイン：ビットマスク → PathCmdList
 */
export function maskToPath(isFilled: (idx: number) => number, width: number, height: number, offset: Vec2): PathCmdList {
  const raw = extractBoundarySegments(isFilled, width, height); // 境界エッジ抽出＋重複除去
  const merged = mergeSegments(raw); // 同一直線マージ
  const loops = buildLoops(merged); // セグメント閉路化
  const cmds = new PathCmdList();

  for (const loop of loops) {
    loop.forEach((pt, i) => {
      const x = pt.x + offset.x,
        y = pt.y + offset.y;
      cmds.add(new PathCmd(i === 0 ? 'M' : 'L', x, y));
    });
    cmds.add(new PathCmd('Z')); // 閉ループ
  }

  return cmds;
}

/** 1. 各ピクセルの「外周エッジ」を抽出し、重複（内部エッジ）を除去 */
function extractBoundarySegments(isFilled: (idx: number) => number, W: number, H: number): Segment[] {
  const keySet = new Map<string, Segment>();
  const addOrRemove = (a: Point, b: Point) => {
    // 頂点をソートしてキーを統一
    const [p1, p2] = a.x < b.x || (a.x === b.x && a.y < b.y) ? [a, b] : [b, a];
    const key = `${p1.x},${p1.y}-${p2.x},${p2.y}`;
    if (keySet.has(key))
      keySet.delete(key); // 重複なら内部→除去
    else keySet.set(key, { p1, p2 });
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (isFilled(y * W + x) === 0) continue;
      // 上辺
      if (y === 0 || isFilled((y - 1) * W + x) === 0) addOrRemove({ x, y }, { x: x + 1, y });
      // 下辺
      if (y === H - 1 || isFilled((y + 1) * W + x) === 0) addOrRemove({ x: x + 1, y: y + 1 }, { x, y: y + 1 });
      // 左辺
      if (x === 0 || isFilled(y * W + x - 1) === 0) addOrRemove({ x, y: y + 1 }, { x, y });
      // 右辺
      if (x === W - 1 || isFilled(y * W + x + 1) === 0) addOrRemove({ x: x + 1, y }, { x: x + 1, y: y + 1 });
    }
  }

  return Array.from(keySet.values());
}

/** 2. 水平／垂直の直線セグメントをできるだけマージ */
function mergeSegments(segs: Segment[]): Segment[] {
  const horiz: Segment[] = [],
    vert: Segment[] = [];
  segs.forEach((s) => {
    if (s.p1.y === s.p2.y) horiz.push(orderHoriz(s));
    else vert.push(orderVert(s));
  });

  const res: Segment[] = [];
  // グループ化＋マージ
  groupBy(horiz, (s) => s.p1.y).forEach((list) => res.push(...mergeLine(list, 'x')));
  groupBy(vert, (s) => s.p1.x).forEach((list) => res.push(...mergeLine(list, 'y')));
  return res;
}
function orderHoriz(s: Segment): Segment {
  return s.p1.x <= s.p2.x ? s : { p1: s.p2, p2: s.p1 };
}
function orderVert(s: Segment): Segment {
  return s.p1.y <= s.p2.y ? s : { p1: s.p2, p2: s.p1 };
}
function groupBy<T>(arr: T[], keyFn: (t: T) => number) {
  const m = new Map<number, T[]>();
  arr.forEach((x) => {
    const k = keyFn(x);
    (m.get(k) || m.set(k, []).get(k)!).push(x);
  });
  return Array.from(m.values());
}
/** 同一直線上で端点がつながるものをマージ */
function mergeLine(list: Segment[], axis: 'x' | 'y'): Segment[] {
  const sorted = list.slice().sort((a, b) => (axis === 'x' ? a.p1.x - b.p1.x : a.p1.y - b.p1.y));
  const out: Segment[] = [];
  let cur = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i];
    if ((axis === 'x' && cur.p2.x >= s.p1.x) || (axis === 'y' && cur.p2.y >= s.p1.y)) {
      // 延長マージ
      cur = {
        p1: cur.p1,
        p2: axis === 'x' ? { x: Math.max(cur.p2.x, s.p2.x), y: cur.p2.y } : { x: cur.p2.x, y: Math.max(cur.p2.y, s.p2.y) },
      };
    } else {
      out.push(cur);
      cur = s;
    }
  }
  out.push(cur);
  return out;
}

/** 3. セグメント群を “一筆書きの閉ループ” に分解 */
function buildLoops(segs: Segment[]): Point[][] {
  const used = new Set<string>();
  const idxByPt = new Map<string, Segment[]>();
  // 頂点→セグメント索引の逆引き
  segs.forEach((s) => {
    [s.p1, s.p2].forEach((p) => {
      const key = `${p.x},${p.y}`;
      (idxByPt.get(key) || idxByPt.set(key, []).get(key)!).push(s);
    });
  });

  const loops: Point[][] = [];
  for (const s0 of segs) {
    const id0 = segKey(s0.p1, s0.p2);
    if (used.has(id0)) continue;

    const loop: Point[] = [s0.p1, s0.p2];
    used.add(id0);

    let prev = s0.p1,
      cur = s0.p2;
    // 次々とつながるセグメントを追跡
    while (true) {
      const cand = idxByPt.get(`${cur.x},${cur.y}`) || [];
      const next = cand.find((s) => {
        const k = segKey(s.p1, s.p2);
        return !used.has(k) && !pointsEqual(s, prev);
      });
      if (!next) break;
      const nextKey = segKey(next.p1, next.p2);
      used.add(nextKey);

      const nxtPt = next.p1.x === cur.x && next.p1.y === cur.y ? next.p2 : next.p1;
      loop.push(nxtPt);
      prev = cur;
      cur = nxtPt;
      if (cur.x === loop[0].x && cur.y === loop[0].y) break;
    }

    loops.push(loop);
  }
  return loops;
}
function segKey(a: Point, b: Point) {
  return `${a.x},${a.y}-${b.x},${b.y}`;
}
function pointsEqual(s: Segment, pt: Point) {
  return (s.p1.x === pt.x && s.p1.y === pt.y) || (s.p2.x === pt.x && s.p2.y === pt.y);
}
