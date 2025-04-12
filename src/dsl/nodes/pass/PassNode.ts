import { NodeType, SledgeNode } from "../SledgeNodes";

export abstract class PassNode extends SledgeNode {
  type: NodeType = "pass";
}
