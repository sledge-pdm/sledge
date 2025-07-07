import { Vec2 } from '../../../../packages/core/src/Vector';

export function drawSquarePixel(p: Vec2, size: number, drawFn: (x: number, y: number) => void) {
  const half = Math.floor(size / 2);
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      drawFn(p.x + dx, p.y + dy);
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
