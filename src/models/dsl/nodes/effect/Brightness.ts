import { EffectNode } from './EffectNode';

export class Brightness extends EffectNode {
  name: string = 'brightness';
  description: string = 'brightness';

  constructor(private delta: number = 30) {
    super();
  }

  getNodeString(): string {
    return `${this.name}(${this.delta})`;
  }
}
