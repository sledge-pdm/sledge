import { selectionManager } from '~/controllers/selection/SelectionManager';
import { Vec2 } from '~/types/Vector';

const mooreDirs: Array<{ dx: number; dy: number }> = [
  { dx: 0, dy: -1 }, // N
  { dx: -1, dy: -1 }, // NW
  { dx: -1, dy: 0 }, // W
  { dx: -1, dy: 1 }, // SW
  { dx: 0, dy: 1 }, // S
  { dx: 1, dy: 1 }, // SE
  { dx: 1, dy: 0 }, // E
  { dx: 1, dy: -1 }, // NE
];

export function traceBoundaryFrom(
  mask: Uint8Array,
  width: number,
  height: number,
  x0: number,
  y0: number,
  offset: Vec2,
  zoom: number
): { path: string; points: Array<{ x: number; y: number }> } {
  function isFilled(x: number, y: number): boolean {
    return x >= 0 && x < width && y >= 0 && y < height && mask[y * width + x] === 1;
  }

  let cx = x0,
    cy = y0;
  let dirIndex = 0;
  const boundaryPoints: Array<{ x: number; y: number }> = [];
  boundaryPoints.push({ x: cx, y: cy });

  let looped = false;
  do {
    let foundNext = false;
    for (let i = 0; i < 8; i++) {
      const idx = (dirIndex + i) & 7;
      const dx = mooreDirs[idx].dx;
      const dy = mooreDirs[idx].dy;
      const nx = cx + dx;
      const ny = cy + dy;

      // 斜め移動 (dx≠0 && dy≠0) のときは、
      // 隣接する直交ピクセルが両方とも塗りでないと飛び込まない
      if (dx !== 0 && dy !== 0) {
        if (!(isFilled(cx + dx, cy) && isFilled(cx, cy + dy))) {
          continue;
        }
      }

      if (isFilled(nx, ny)) {
        cx = nx;
        cy = ny;
        boundaryPoints.push({ x: cx, y: cy });
        dirIndex = (idx + 6) & 7;
        foundNext = true;
        break;
      }
    }
    if (!foundNext) break;
    if (cx === x0 && cy === y0 && boundaryPoints.length > 1) {
      looped = true;
      break;
    }
  } while (!looped);

  if (!looped || boundaryPoints.length < 2) {
    return { path: '', points: [] };
  }

  // ─── ここから「同方向連続部分をまとめる」処理 ───
  // ※ まず、最後に重複しているスタート点があれば取り除く
  const pts: Array<{ x: number; y: number }> = [...boundaryPoints];
  if (pts.length >= 2) {
    const last = pts[pts.length - 1];
    const first = pts[0];
    if (last.x === first.x && last.y === first.y) {
      pts.pop();
    }
  }

  const reduced: Array<{ x: number; y: number }> = [];
  // 最初のポイントは必ず入れる
  reduced.push(pts[0]);

  // 方向(dx,dy) の変化を見ながらまとめる
  let prevDir: { dx: number; dy: number } | null = null;
  let isExpanding = false;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;

    if (prevDir === null) {
      prevDir = { dx, dy };
      continue;
    }
    // 同じ方向が続く限りスキップ
    if (dx === prevDir.dx && dy === prevDir.dy) {
      // 何もしない（末尾だけ伸ばす）
    } else {
      // 方向が変わったら、前のセグメントの末尾点を reduced に追加
      reduced.push(prev);
      prevDir = { dx, dy };
    }
  }
  // 最後のポイントを必ず追加
  reduced.push(pts[pts.length - 1]);
  // ─────────────────────────────────

  // reduced から SVG path を作る
  const cmds: string[] = [];
  for (let i = 0; i < reduced.length; i++) {
    const p = reduced[i];

    const px = (p.x + offset.x) * zoom;
    const py = (p.y + offset.y) * zoom;
    if (i === 0) {
      cmds.push(`M ${px} ${py}`);
    } else {
      cmds.push(`L ${px} ${py}`);
    }
  }
  cmds.push('Z');

  return { path: cmds.join(' '), points: boundaryPoints };
}

function getCombinedMask(
  width: number, // 元キャンバス幅
  height: number, // 元キャンバス高
  activeMask: Uint8Array,
  previewMask?: Uint8Array
): Uint8Array {
  const omWidth = width + 1; // 拡張後
  const omHeight = height + 1;
  const combined = new Uint8Array(omWidth * omHeight);

  // --- ① 元マスクを行コピー ---------------------------------
  for (let y = 0; y < height; y++) {
    const srcOff = y * width;
    const dstOff = y * omWidth;
    combined.set(activeMask.subarray(srcOff, srcOff + width), dstOff);
  }

  // --- ② preview が無ければこれで終わり ----------------------
  if (!previewMask) {
    dilateOnePixel(combined, omWidth, omHeight);
    return combined;
  }

  // --- ③ preview と合成 (OR / SUBTRACT) ---------------------
  const modeSub = selectionManager.getCurrentMode() === 'subtract';

  for (let y = 0; y < height; y++) {
    const srcOff = y * width;
    const dstOff = y * omWidth;
    for (let x = 0; x < width; x++) {
      const iDst = dstOff + x;
      const iSrc = srcOff + x;
      combined[iDst] = modeSub
        ? combined[iDst] & (previewMask[iSrc] ^ 1) // AND NOT
        : combined[iDst] | previewMask[iSrc]; // OR
    }
  }

  // --- ④ 右・下・右下 へ 1 px 膨張 --------------------------
  dilateOnePixel(combined, omWidth, omHeight);
  return combined;
}

// ────────────────────────────────────────────
// 右／下／右下 1 px 膨張だけを行う小関数
function dilateOnePixel(buf: Uint8Array, W: number, H: number) {
  for (let y = H - 2; y >= 0; y--) {
    // 最下行は不要
    const rowOff = y * W;
    const nextRowOff = rowOff + W;
    for (let x = W - 2; x >= 0; x--) {
      // 右端列は不要
      const i = rowOff + x;
      if (!buf[i]) continue;
      buf[i + 1] = 1; // 右
      buf[nextRowOff + x] = 1; // 下
      buf[nextRowOff + x + 1] = 1; // 右下
    }
  }
}

export function traceAllBoundaries(
  activeMask: Uint8Array,
  previewMask: Uint8Array | undefined,
  width: number,
  height: number,
  offset: Vec2,
  zoom: number
): string {
  const omWidth = width + 1;
  const omHeight = height + 1;

  const mask = getCombinedMask(width, height, activeMask, previewMask);

  function isFilled(x: number, y: number): boolean {
    return x >= 0 && x < omWidth && y >= 0 && y < omHeight && mask[y * omWidth + x] === 1;
  }
  function isBoundaryPixel(x: number, y: number): boolean {
    if (!isFilled(x, y)) return false;
    if (!isFilled(x, y - 1) || !isFilled(x, y + 1) || !isFilled(x - 1, y) || !isFilled(x + 1, y)) {
      return true;
    }
    return false;
  }

  const visited = new Uint8Array(omWidth * omHeight);
  const pathList: string[] = [];

  for (let y = 0; y < omHeight; y++) {
    for (let x = 0; x < omWidth; x++) {
      const idx = y * omWidth + x;
      if (visited[idx] === 1) continue;
      if (!isBoundaryPixel(x, y)) continue;

      const { path, points } = traceBoundaryFrom(mask, omWidth, omHeight, x, y, offset, zoom);
      if (path) {
        pathList.push(path);
        for (const p of points) {
          visited[p.y * omWidth + p.x] = 1;
        }
      }
    }
  }

  return pathList.length === 0 ? '' : pathList.join(' ');
}
