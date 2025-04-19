import { NodeType, SledgeNode } from "../DSLNodes";

export abstract class EffectNode extends SledgeNode {
  type: NodeType = "effect";
}
