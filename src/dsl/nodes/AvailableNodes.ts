import { SledgeNode } from "./DSLNodes";
import { Brightness } from "./effect/Brightness";
import { GrayScale } from "./effect/GrayScale";
import { Invert } from "./effect/Invert";
import { Sepia } from "./effect/Sepia";
import { JpegGlitch } from "./fracture/JpegGlitch";

export const ALL_NODES: SledgeNode[] = [
  // effect
  new Brightness(),
  new GrayScale(),
  new Invert(),
  new Sepia(),
  // pass
  // new LayerIn(""),
  // new LayerOut(""),
  // fracture
  new JpegGlitch(),
];
