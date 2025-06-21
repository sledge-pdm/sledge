import { Vec2 } from "~/types/Vector";
import { RGBAColor } from "~/utils/ColorUtils";

export default interface ToolArgs {
  position: Vec2;
  lastPosition?: Vec2;
  color: RGBAColor; // RGBA
  size?: number;
  event?: PointerEvent;
  // TODO: pressure, tilt, ...
}
