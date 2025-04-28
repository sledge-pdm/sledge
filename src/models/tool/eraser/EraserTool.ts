import LayerImageAgent from '~/models/layer_image/LayerImageAgent';
import { drawCompletionLine, drawSquarePixel } from '../../../utils/DrawUtils';
import { Tool, ToolArgs } from '../ToolBase';

export class EraserTool implements Tool {
  onStart(agent: LayerImageAgent, args: ToolArgs) {
    return false;
  }

  onMove(agent: LayerImageAgent, { position, lastPosition, size }: ToolArgs) {
    if (!size) return false;

    drawSquarePixel(position, size, (px, py) => {
      const diff = agent.deletePixel({ x: px, y: py }, true, true);
      if (diff !== undefined) {
        agent.addDiffs([diff]);
      }
    });

    if (lastPosition !== undefined) {
      drawCompletionLine(position, lastPosition, (x, y) => {
        drawSquarePixel({ x, y }, size, (px, py) => {
          const diff = agent.deletePixel({ x: px, y: py }, true, true);
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
