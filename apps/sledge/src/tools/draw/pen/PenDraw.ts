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
