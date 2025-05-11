import { PixelDiff } from '~/models/history/HistoryManager';
import { Vec2 } from '~/types/Vector';
import { RGBAColor } from '~/utils/ColorUtils';

export default class PixelBuffer {
  constructor(
    public buffer: Uint8ClampedArray,
    public width: number,
    public height: number
  ) {}

  public getPixel(position: Vec2): RGBAColor {
    const i = (position.y * this.width + position.x) * 4;
    return [this.buffer[i], this.buffer[i + 1], this.buffer[i + 2], this.buffer[i + 3]];
  }

  public setRawPixel(position: Vec2, color: RGBAColor): PixelDiff | undefined {
    if (!this.isInBounds(position)) return undefined;
    const idx = position.y * this.width + position.x;
    const ptr = idx * 4;
    const before: RGBAColor = [this.buffer[ptr], this.buffer[ptr + 1], this.buffer[ptr + 2], this.buffer[ptr + 3]];

    this.buffer[ptr] = color[0];
    this.buffer[ptr + 1] = color[1];
    this.buffer[ptr + 2] = color[2];
    this.buffer[ptr + 3] = color[3];

    return { kind: 'pixel', position, before, after: color };
  }

  public deleteRawPixel(position: Vec2): PixelDiff | undefined {
    return this.setRawPixel(position, [0, 0, 0, 0]);
  }

  public isInBounds(position: Vec2) {
    return position.x >= 0 && position.y >= 0 && position.x < this.width && position.y < this.height;
  }
}
