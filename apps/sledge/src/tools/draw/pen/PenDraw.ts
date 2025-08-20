import { Vec2 } from '@sledge/core';

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

  for (let dy = start; dy <= end; dy++) {
    for (let dx = start; dx <= end; dx++) {
      drawFn(centerX + dx, centerY + dy);
    }
  }
}

export function drawCirclePixel(p: Vec2, rawP: Vec2 | undefined, size: number, dotMagnification: number, drawFn: (x: number, y: number) => void) {
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

  const radius = size / 2;
  const radiusSquared = radius * radius;

  // 円の境界を計算
  const bound = Math.ceil(radius);

  for (let dy = -bound; dy <= bound; dy++) {
    for (let dx = -bound; dx <= bound; dx++) {
      // 中心からの距離の2乗を計算
      const distanceSquared = dx * dx + dy * dy;

      // 円の内部にあるかチェック（αチャンネルなしなので完全に内部のみ）
      if (distanceSquared <= radiusSquared) {
        drawFn(centerX + dx, centerY + dy);
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
