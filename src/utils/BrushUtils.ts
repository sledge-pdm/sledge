export function drawBrush(
  x: number,
  y: number,
  size: number,
  drawFn: (x: number, y: number) => void,
) {
  const half = Math.floor(size / 2);
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      drawFn(x + dx, y + dy);
    }
  }
}
