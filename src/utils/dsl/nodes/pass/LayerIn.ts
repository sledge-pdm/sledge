import { PassNode } from './PassNode';

export class LayerIn extends PassNode {
  name: string = 'in';
  description: string = 'layer_in';

  constructor(public layerId?: string) {
    super();
  }

  getNodeString(): string | undefined {
    if (!this.layerId) return undefined;
    return `${this.name}(${this.layerId})`;
  }
}
