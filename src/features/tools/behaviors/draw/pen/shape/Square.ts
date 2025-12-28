import { ShapeMask } from '@sledge/anvil';
import { Vec2 } from '@sledge/core';
import { BaseShape } from '~/features/tools/behaviors/draw/pen/shape/BaseShape';

export class Square extends BaseShape {
  readonly SHAPE_ID = 'square';

  private drawSquarePixel(p: Vec2, rawP: Vec2 | undefined, size: number, dotMagnification: number, drawFn: (x: number, y: number) => void) {
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

  createMask(): ShapeMask {
    const size = this.size;

    // まず中心(0,0)基準で描かれる座標を収集
    const coords: Array<{ x: number; y: number }> = [];
    const seen = new Set<string>();

    const p = { x: 0, y: 0 } as Vec2;
    const rawP = size % 2 === 0 ? ({ x: 0, y: 0 } as Vec2) : undefined; // 偶数サイズ時の中心決定を実描画と揃える

    this.drawSquarePixel(p, rawP, size, 1, (px, py) => {
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
}
