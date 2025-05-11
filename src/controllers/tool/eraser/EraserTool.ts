import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { ToolArgs, ToolBehavior } from '../../../models/tool/ToolBase';
import { drawCompletionLine, drawSquarePixel } from '../../../utils/DrawUtils';

export class EraserTool implements ToolBehavior {
  onStart(agent: LayerImageAgent, args: ToolArgs) {
    return false;
  }

  onMove(agent: LayerImageAgent, { position, lastPosition, size }: ToolArgs) {
    if (!size) return false;
    const dm = agent.getDiffManager();

    drawSquarePixel(position, size, (px, py) => {
      const diff = agent.deletePixel({ x: px, y: py }, false);
      if (diff !== undefined) {
        dm.add(diff);
      }
    });

    if (lastPosition !== undefined) {
      drawCompletionLine(position, lastPosition, (x, y) => {
        drawSquarePixel({ x, y }, size, (px, py) => {
          const diff = agent.deletePixel({ x: px, y: py }, false);
          if (diff !== undefined) {
            dm.add(diff);
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
