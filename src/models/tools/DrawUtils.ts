import { Vec2 } from "../types/Vector";

export function drawSquarePixel(
  p: Vec2,
  size: number,
  drawFn: (x: number, y: number) => void,
) {
  const half = Math.floor(size / 2);
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      drawFn(p.x + dx, p.y + dy);
    }
  }
}

export function drawCompletionLine(
  p0: Vec2,
  p1: Vec2,
  draw: (x: number, y: number) => void,
) {
  const dx = Math.abs(p1.x - p0.x);
  const dy = Math.abs(p1.y - p0.y);
  const sx = p0.x < p1.x ? 1 : -1;
  const sy = p0.y < p1.y ? 1 : -1;
  let err = dx - dy;

  while (true) {
    draw(p0.x, p0.y);
    if (p0.x === p1.x && p0.y === p1.y) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      p0.x += sx;
    }
    if (e2 < dx) {
      err += dx;
      p0.y += sy;
    }
  }
}
