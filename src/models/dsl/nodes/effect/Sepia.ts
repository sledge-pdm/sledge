import { EffectNode } from './EffectNode';

export class Sepia extends EffectNode {
  name: string = 'sepia';
  description: string = 'sepia';

  getNodeString(): string {
    return `${this.name}()`;
  }
}
