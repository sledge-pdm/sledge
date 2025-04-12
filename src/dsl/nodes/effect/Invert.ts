import { EffectNode } from "./EffectNode";

export class Invert extends EffectNode {
  name: string = "invert";
  description: string = "invert";

  getNodeString(): string {
    return `${this.name}()`;
  }
}
