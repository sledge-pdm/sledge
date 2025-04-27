import { NodeType, SledgeNode } from '../DSLNodes';

export abstract class PassNode extends SledgeNode {
  type: NodeType = 'pass';
}
