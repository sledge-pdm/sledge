import { ShapeMask } from '@sledge/anvil';
import { BaseShape } from '~/tools/draw/pen/shape/BaseShape';
import { Circle } from '~/tools/draw/pen/shape/Circle';
import { Square } from '~/tools/draw/pen/shape/Square';

export class ShapeStore {
  private store: Map<string, ShapeMask>;

  constructor() {
    this.store = new Map();
  }

  private generateKey(shape: BaseShape, size: number): string {
    return `${shape.SHAPE_ID}:${size}`;
  }

  get(shape: 'square' | 'circle', size: number): ShapeMask | undefined {
    let shapeInstance: BaseShape;
    switch (shape) {
      case 'square':
        shapeInstance = new Square(size);
        break;
      case 'circle':
        shapeInstance = new Circle(size);
        break;
      default:
        return;
    }

    const key = this.generateKey(shapeInstance, size);
    if (this.store.has(key)) {
      return this.store.get(key);
    } else {
      const mask = shapeInstance.createMask();
      this.store.set(key, mask);
      return mask;
    }
  }
}
