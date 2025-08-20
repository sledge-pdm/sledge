import { Vec2 } from '@sledge/core';

/**
 * 現在のペン設定で「中心を (0,0) に置いたとき」に描かれるピクセル集合から、
 * 最小の軸揃え矩形マスクとそのオフセットを生成します。
 * 返る offsetX/offsetY は中心からマスク左上までの相対量（キャンバス座標系の整数）です。
 */
export function getDrawnPixelMask(
  size: number,
  shape: 'square' | 'circle'
): { mask: Uint8Array; width: number; height: number; offsetX: number; offsetY: number } {
  const drawPixel = shape === 'circle' ? drawCirclePixel : drawSquarePixel;

  // まず中心(0,0)基準で描かれる座標を収集
  const coords: Array<{ x: number; y: number }> = [];
  const seen = new Set<string>();

  const p = { x: 0, y: 0 } as Vec2;
  const rawP = size % 2 === 0 ? ({ x: 0, y: 0 } as Vec2) : undefined; // 偶数サイズ時の中心決定を実描画と揃える

  drawPixel(p, rawP, size, 1, (px, py) => {
    const key = `${px},${py}`;
    if (!seen.has(key)) {
      seen.add(key);
      coords.push({ x: px, y: py });
    }
  });

  if (coords.length === 0) {
    return { mask: new Uint8Array(0), width: 0, height: 0, offsetX: 0, offsetY: 0 };
  }

  // 最小バウンディングボックスを算出
  let minX = coords[0].x,
    maxX = coords[0].x,
    minY = coords[0].y,
    maxY = coords[0].y;
  for (const { x, y } of coords) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const mask = new Uint8Array(width * height);

  for (const { x, y } of coords) {
    const ix = x - minX;
    const iy = y - minY;
    if (ix >= 0 && iy >= 0 && ix < width && iy < height) {
      mask[iy * width + ix] = 1;
    }
  }

  return { mask, width, height, offsetX: minX, offsetY: minY };
}

export function drawSquarePixel(p: Vec2, rawP: Vec2 | undefined, size: number, dotMagnification: number, drawFn: (x: number, y: number) => void) {
  let centerX: number, centerY: number;

  if (size % 2 === 0 && rawP) {
    // 偶数サイズ: rawPositionを基準に最適な中心を計算
    centerX = Math.round(rawP.x / dotMagnification);
    centerY = Math.round(rawP.y / dotMagnification);
  } else {
    // 奇数サイズ: 従来通りピクセル中心
    centerX = p.x;
    centerY = p.y;
  }

  const half = Math.floor(size / 2);
  const start = -half;
  const end = size - half - 1;

  // const centerColor = getRandomColorRGBA();
  // const boundColor = getRandomColorRGBA();
  // setLogStore('canvasDebugPoints', (prev) => {
  //   return [
  //     ...prev,
  //     { x: centerX, y: centerY, color: centerColor },
  //     { x: centerX + start, y: centerY, color: boundColor },
  //     { x: centerX, y: centerY + start, color: boundColor },
  //     { x: centerX + end, y: centerY, color: boundColor },
  //     { x: centerX, y: centerY + end, color: boundColor },
  //   ];
  // });

  for (let dy = start; dy <= end; dy++) {
    for (let dx = start; dx <= end; dx++) {
      drawFn(centerX + dx, centerY + dy);
    }
  }
}

export function drawCirclePixel(p: Vec2, rawP: Vec2 | undefined, size: number, dotMagnification: number, drawFn: (x: number, y: number) => void) {
  let centerX: number, centerY: number;

  if (size % 2 === 0 && rawP) {
    // 偶数サイズ: rawPositionを基準にピクセル境界の中心を計算
    centerX = Math.round(rawP.x / dotMagnification);
    centerY = Math.round(rawP.y / dotMagnification);
  } else {
    // 奇数サイズ: 従来通りピクセル中心（整数座標）
    centerX = p.x;
    centerY = p.y;
  }

  const radius = size / 2;
  const radiusSquared = radius * radius;

  const bound = Math.ceil((size - 1) / 2);

  // const centerColor = getRandomColorRGBA();
  // const boundColor = getRandomColorRGBA();
  // setLogStore('canvasDebugPoints', (prev) => {
  //   return [
  //     ...prev,
  //     { x: centerX, y: centerY, color: centerColor },
  //     { x: centerX - bound, y: centerY, color: boundColor },
  //     { x: centerX, y: centerY - bound, color: boundColor },
  //     { x: centerX + bound, y: centerY, color: boundColor },
  //     { x: centerX, y: centerY + bound, color: boundColor },
  //   ];
  // });

  for (let dy = -bound; dy <= bound; dy++) {
    for (let dx = -bound; dx <= bound; dx++) {
      let pixelX: number, pixelY: number;

      if (size % 2 === 0) {
        // 偶数サイズ：整数ピクセル座標に変換
        pixelX = Math.floor(centerX + dx);
        pixelY = Math.floor(centerY + dy);

        // ピクセル中心から円の中心への距離を計算
        const deltaX = pixelX + 0.5 - centerX;
        const deltaY = pixelY + 0.5 - centerY;
        const distanceSquared = deltaX * deltaX + deltaY * deltaY;

        if (distanceSquared <= radiusSquared) {
          drawFn(pixelX, pixelY);
        }
      } else {
        // 奇数サイズ：従来通り
        pixelX = centerX + dx;
        pixelY = centerY + dy;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared <= radiusSquared) {
          drawFn(pixelX, pixelY);
        }
      }
    }
  }
}

export function drawCompletionLine(p0: Vec2, p1: Vec2, draw: (x: number, y: number) => void) {
  const dx = Math.abs(p1.x - p0.x);
  const dy = Math.abs(p1.y - p0.y);
  const sx = p0.x < p1.x ? 1 : -1;
  const sy = p0.y < p1.y ? 1 : -1;
  let err = dx - dy;

  const steps = Math.max(dx, dy); // 移動回数の上限

  let x = p0.x;
  let y = p0.y;

  for (let i = 0; i <= steps; i++) {
    draw(x, y);
    if (x === p1.x && y === p1.y) {
      break; // 念のため（ただたどり着く設計にはなってる）
    }
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}
