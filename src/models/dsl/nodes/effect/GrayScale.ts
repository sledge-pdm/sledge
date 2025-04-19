import { EffectNode } from "./EffectNode";

export class GrayScale extends EffectNode {
  name: string = "grayscale";
  description: string = "grayscale";

  getNodeString(): string {
    return `${this.name}()`;
  }
}
