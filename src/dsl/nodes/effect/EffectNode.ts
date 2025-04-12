import { NodeType, SledgeNode } from "../SledgeNodes";

export abstract class EffectNode extends SledgeNode {
  type: NodeType = "effect";
}
