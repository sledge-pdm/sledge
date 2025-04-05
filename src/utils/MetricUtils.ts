export function roundPosition(position: { x: number; y: number }): {
  x: number;
  y: number;
} {
  return {
    x: Math.round(position.x - 0.5),
    y: Math.round(position.y - 0.5),
  };
}

export function drawLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  draw: (x: number, y: number) => void
) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    draw(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}
