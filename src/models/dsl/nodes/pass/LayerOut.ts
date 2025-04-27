import { PassNode } from './PassNode';

export class LayerOut extends PassNode {
  name: string = 'out';
  description: string = 'out';

  constructor(public layerId?: string) {
    super();
  }

  getNodeString(): string | undefined {
    if (!this.layerId) return undefined;
    return `${this.name}(${this.layerId})`;
  }
}
