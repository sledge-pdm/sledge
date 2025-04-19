// 旧
// export enum ImageCommands {
//   INVERT = "invert",
//   GRAYSCALE = "grayscale",
//   GLITCH = "glitch",
//   SEPIA = "sepia",
//   BRIGHTNESS = "brightness",
// }
// export type ImageCommandParams =
//   | {
//       command:
//         | ImageCommands.INVERT
//         | ImageCommands.GRAYSCALE
//         | ImageCommands.SEPIA;
//     }
//   | { command: ImageCommands.BRIGHTNESS; delta: number };

export type NodeType = "effect" | "pass" | "fracture";

export interface NodeArg {
  name: string;
  default: number | string | undefined;
}

export abstract class SledgeNode {
  abstract name: string;
  abstract type: NodeType;
  abstract description: string;

  constructor() {}

  // error occured = undefined
  abstract getNodeString(): string | undefined;
}
