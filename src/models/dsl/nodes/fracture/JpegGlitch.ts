import { FractureNode } from './FractureNode';

export class JpegGlitch extends FractureNode {
  name = 'jpeg_glitch';
  description = 'JPEG glitch effect using random byte corruption';

  private seed = Math.floor(Math.random() * 100);
  private quality = 90;
  private amount = 0.001; // 2%の破壊

  getNodeString(): string {
    return `${this.name}(${this.seed}, ${this.quality}, ${this.amount})`;
  }
}
