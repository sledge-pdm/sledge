import LayerImageAgent from "~/models/layer_image/LayerImageAgent";
import { drawCompletionLine, drawSquarePixel } from "../DrawUtils";
import { Tool, ToolArgs } from "../ToolBase";

export class PenTool implements Tool {
  onStart(agent: LayerImageAgent, args: ToolArgs) {
    return false;
  }

  onMove(
    agent: LayerImageAgent,
    { position, lastPosition, color, size }: ToolArgs,
  ) {
    if (!size) return false;

    drawSquarePixel(position, size, (px, py) => {
      const diff = agent.setPixel({ x: px, y: py }, color, true, true);
      if (diff !== undefined) {
        agent.addDiffs([diff]);
      }
    });

    if (lastPosition !== undefined) {
      drawCompletionLine(position, lastPosition, (x, y) => {
        drawSquarePixel({ x, y }, size, (px, py) => {
          const diff = agent.setPixel({ x: px, y: py }, color, true, true);
          if (diff !== undefined) {
            agent.addDiffs([diff]);
          }
        });
      });
    }

    return true;
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    return false;
  }
}
