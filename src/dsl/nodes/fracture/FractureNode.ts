import { NodeType, SledgeNode } from "../SledgeNodes";

export abstract class FractureNode extends SledgeNode {
  type: NodeType = "fracture";
}
