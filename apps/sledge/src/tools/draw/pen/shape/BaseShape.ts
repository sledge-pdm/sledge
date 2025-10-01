import { ShapeMask } from '@sledge/anvil';

export abstract class BaseShape {
  abstract readonly SHAPE_ID: string;

  constructor(protected readonly size: number) {}

  getSize(): number {
    return this.size;
  }

  abstract createMask(): ShapeMask;
}
