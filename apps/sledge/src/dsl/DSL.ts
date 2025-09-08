import { findLayerById } from '~/features/layer';
import { LayerIn } from './nodes/pass/LayerIn';
import { LayerOut } from './nodes/pass/LayerOut';
import { SledgeNode } from '~/dsl/nodes/DSLNodes';

export class DSL {
  layerIn: LayerIn;
  readonly nodes: SledgeNode[];
  layerOut: LayerOut;

  constructor(inLayerId: string, outLayerId: string) {
    this.layerIn = new LayerIn(inLayerId);
    this.nodes = [];
    this.layerOut = new LayerOut(outLayerId);
  }

  public addNode(node: SledgeNode) {
    this?.nodes.push(node);
  }

  public build(exceptIn: boolean = false): string | undefined {
    const nodes = exceptIn ? [...this.nodes, this.layerOut] : [this.layerIn, ...this.nodes, this.layerOut];

    const nodeStrings: string[] = [];
    let isAllNodeParseSuccessful = true;
    nodes.forEach((node, i) => {
      const nodeStr = node.getNodeString();
      if (nodeStr !== undefined) nodeStrings.push(nodeStr);
      else {
        isAllNodeParseSuccessful = false;
        throw `DSL parse failed in: ${node.name} [${i}]`;
      }
    });

    if (isAllNodeParseSuccessful) {
      // if all nodes parsed successfully
      return nodeStrings.join(' > '); // in(inLayerId) > out(outLayerId) by default
    } else {
      // if some nodes failed to parse
      return undefined;
    }
  }

  public toString(): string {
    let str = this.build();
    if (str === undefined) throw 'DSL parse failed.';
    else {
      // 読みやすくする
      const inId = this.layerIn.layerId;
      const outId = this.layerOut.layerId;
      if (inId !== undefined) str = str.replaceAll(inId, `${findLayerById(inId)?.name || 'N/A'} ID`);
      if (outId !== undefined) str = str.replaceAll(outId, `${findLayerById(outId)?.name || 'N/A'} ID`);
      str = str.replaceAll(' > ', '\n> ');
      return str;
    }
  }
}
