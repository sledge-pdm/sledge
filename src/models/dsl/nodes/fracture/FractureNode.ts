import { NodeType, SledgeNode } from "../DSLNodes";

export abstract class FractureNode extends SledgeNode {
  type: NodeType = "fracture";
}
