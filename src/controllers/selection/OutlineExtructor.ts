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

/**
 * mask: Uint8Array(幅=width,高さ=height) を
 * 「右に1列」「下に1行」を 0 で埋めた新しいサイズの Uint8Array に変換する。
 */
function padMask(mask: Uint8Array, width: number, height: number): { padded: Uint8Array; w: number; h: number } {
  const w2 = width + 1;
  const h2 = height + 1;
  const padded = new Uint8Array(w2 * h2);

  // 元マスクをそのまま左上にコピー
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      padded[y * w2 + x] = mask[y * width + x];
    }
  }
  // 右端の列と下端の行は初期値 0 のまま (padded 配列は初期化時にすべて 0)
  return { padded, w: w2, h: h2 };
}

/**
 * mask: Uint8Array (長さ = W*H), width, height: マスクサイズ
 * offset, zoom: 描画時のオフセットと倍率
 *
 * 「パディングしたマスク」を内部で自動的に作ってから
 * traceBoundaryFrom を呼び出し、「右下が 1px 拡張されたパス」を返す。
 */
export function traceBoundaryFrom(
  mask: Uint8Array,
  width: number,
  height: number,
  x0: number,
  y0: number,
  offset: Vec2,
  zoom: number
): { path: string; points: Array<{ x: number; y: number }> } {
  // ← 呼び出し元では必ず (x0,y0) が元マスクの境界ピクセル
  //    だが、パディング後は y0,x0 はそのまま使えるため、特に調整不要。

  // 1) マスクを「右1・下1」にパディング
  const { padded, w: w2, h: h2 } = padMask(mask, width, height);

  // 2) 以降の探索ロジックは、padded, w2, h2 を使うだけ
  function isFilled(x: number, y: number): boolean {
    return x >= 0 && x < w2 && y >= 0 && y < h2 && padded[y * w2 + x] === 1;
  }

  let cx = x0;
  let cy = y0;
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

      // 斜め移動は直交の両隣が両方塗りの場合のみ許可 (従来と同じ)
      if (dx !== 0 && dy !== 0) {
        if (!(isFilled(cx + dx, cy) && isFilled(cx, cy + dy))) {
          continue;
        }
      }

      if (isFilled(nx, ny)) {
        cx = nx;
        cy = ny;
        boundaryPoints.push({ x: cx, y: cy });
        // 次回探索は idx の２つ前にセット
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

  // ── 同方向連続部分をまとめる処理 ──
  const pts: Array<{ x: number; y: number }> = [...boundaryPoints];
  if (pts.length >= 2) {
    const last = pts[pts.length - 1];
    const first = pts[0];
    if (last.x === first.x && last.y === first.y) {
      pts.pop();
    }
  }
  const reduced: Array<{ x: number; y: number }> = [];
  reduced.push(pts[0]);
  let prevDir: { dx: number; dy: number } | null = null;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    if (prevDir === null) {
      prevDir = { dx, dy };
      continue;
    }
    if (dx === prevDir.dx && dy === prevDir.dy) {
      // 同じ方向が続くならスキップ
    } else {
      reduced.push(prev);
      prevDir = { dx, dy };
    }
  }
  reduced.push(pts[pts.length - 1]);
  // ────────────────────────────────

  // パス生成時は「padded サイズのインデックス」をそのまま座標に使うだけで、
  // もともと「(width, height) の範囲」が (width+1, height+1) まで拡張されているため、
  // 結果的に右端・下端が「＋1」された状態で path が作られる。
  const cmds: string[] = [];
  for (let i = 0; i < reduced.length; i++) {
    const p = reduced[i];
    // ここで p.x, p.y は padded マスク上の座標 (元 mask の右１つ・下１つ位置を含む)
    const px = (p.x + offset.x) * zoom;
    const py = (p.y + offset.y) * zoom;
    if (i === 0) {
      cmds.push(`M ${px} ${py}`);
    } else {
      cmds.push(`L ${px} ${py}`);
    }
  }
  cmds.push('Z');

  // boundaryPoints は「元パディング前の範囲内の座標」しか入っていないので、
  // 呼び出し元で「訪問済みマーク」をつけるときには、 padMask 忘れず。
  return { path: cmds.join(' '), points: boundaryPoints };
}

/**
 * mask: Uint8Array (長さ = W*H)
 * width, height: 元マスクサイズ
 * offset, zoom: 描画時のオフセットと倍率
 *
 * 「パディング前の (x,y) をそのまま traceBoundaryFrom に渡せば、結果として
 * 右と下に1px 拡張された形」の path が返るようになります。
 */
export function traceAllBoundaries(mask: Uint8Array, width: number, height: number, offset: Vec2, zoom: number): string {
  function isFilled(x: number, y: number): boolean {
    // ※ ここでは呼び出しのたびに padMask するため、
    //    実際の判定は traceBoundaryFrom 内の padded を使います。
    return x >= 0 && x < width && y >= 0 && y < height && mask[y * width + x] === 1;
  }
  function isBoundaryPixel(x: number, y: number): boolean {
    if (!isFilled(x, y)) return false;
    if (!isFilled(x, y - 1) || !isFilled(x, y + 1) || !isFilled(x - 1, y) || !isFilled(x + 1, y)) {
      return true;
    }
    return false;
  }

  const visited = new Uint8Array(width * height);
  const pathList: string[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx] === 1) continue;
      if (!isBoundaryPixel(x, y)) continue;

      const { path, points } = traceBoundaryFrom(mask, width, height, x, y, offset, zoom);
      if (path) {
        pathList.push(path);
        // 元 mask 上のピクセル座標で訪問フラグを立てる
        for (const p of points) {
          visited[p.y * width + p.x] = 1;
        }
      }
    }
  }

  return pathList.length === 0 ? '' : pathList.join(' ');
}
