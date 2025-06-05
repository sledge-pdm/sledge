// Outline tracer: Moore-Neighbor tracing

/**
 * 8 近傍方向ベクトル (dx,dy) の定義順序。
 * Moore tracing では通常「反時計回り (W→NW→N→NE→E→SE→S→SW)」の順で探索しますが、
 * ここでは「北(N) → 北西(NW) → 西(W) → …」の順にしておきます（慣例と異なっても OK）。
 */
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
 * mask: Uint8Array (長さ = W*H), width, height: マスクのサイズ
 * zoom: 描画時の拡大倍率
 * x0, y0: たどる外周のスタート座標 (必ず isBoundaryPixel(x0,y0) を満たすこと)
 *
 * @returns
 *   {
 *     path: string;                      // "M 0 0 L 1 0 L 1 1 L 0 1 Z" など
 *     points: Array<{ x: number; y: number }>; // 実際にたどった境界ピクセル一覧 (ループ中の全座標)
 *   }
 *   トレースに失敗した場合は { path: '', points: [] } を返します。
 */
export function traceBoundaryFrom(
  mask: Uint8Array,
  width: number,
  height: number,
  x0: number,
  y0: number,
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
      if (isFilled(nx, ny)) {
        cx = nx;
        cy = ny;
        boundaryPoints.push({ x: cx, y: cy });
        dirIndex = (idx + 6) & 7;
        foundNext = true;
        break;
      }
    }
    if (!foundNext) {
      break;
    }
    if (cx === x0 && cy === y0 && boundaryPoints.length > 1) {
      looped = true;
      break;
    }
  } while (!looped);

  if (!looped || boundaryPoints.length < 2) {
    return { path: '', points: [] };
  }

  const cmds: string[] = [];
  for (let i = 0; i < boundaryPoints.length; i++) {
    const p = boundaryPoints[i];
    const px = p.x * zoom;
    const py = p.y * zoom;
    if (i === 0) {
      cmds.push(`M ${px} ${py}`);
    } else {
      cmds.push(`L ${px} ${py}`);
    }
  }
  cmds.push('Z');
  return { path: cmds.join(' '), points: boundaryPoints };
}

/**
 * mask: Uint8Array (長さ = W*H), 1 = 選択済, 0 = 未選択
 * width, height: マスクの横幅・高さ
 * zoom: 描画時の拡大倍率
 *
 * マスク内にあるすべての「離れた選択領域の外周」を検出し、
 * 各外周を一筆書き輪郭パス (M…L…Z) として連結して返す。
 *
 * @returns 複数領域がある場合は "M…Z M…Z M…Z" のようにスペースでつないだ文字列。
 */
export function traceAllBoundaries(mask: Uint8Array, width: number, height: number, zoom: number): string {
  function isFilled(x: number, y: number): boolean {
    return x >= 0 && x < width && y >= 0 && y < height && mask[y * width + x] === 1;
  }

  function isBoundaryPixel(x: number, y: number): boolean {
    if (!isFilled(x, y)) return false;
    if (!isFilled(x, y - 1) || !isFilled(x, y + 1) || !isFilled(x - 1, y) || !isFilled(x + 1, y)) {
      return true;
    }
    return false;
  }

  // 訪問済み外周ピクセルをマークするバッファ
  const visited = new Uint8Array(width * height);
  const pathList: string[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx] === 1) continue;
      if (!isBoundaryPixel(x, y)) continue;

      // (x,y) が「未訪問の外周ピクセル」ならここが新しい領域のスタート
      const { path, points } = traceBoundaryFrom(mask, width, height, x, y, zoom);
      if (path) {
        pathList.push(path);

        // points のみを訪問済みにする
        for (const p of points) {
          visited[p.y * width + p.x] = 1;
        }
      }
    }
  }

  if (pathList.length === 0) {
    return '';
  }
  return pathList.join(' ');
}
