import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { colorMatch, RGBAColor } from '~/utils/ColorUtils';
import { drawCompletionLine, drawSquarePixel } from '../../utils/DrawUtils';
import { ToolArgs, ToolBehavior } from '../ToolBase';

export class PenTool implements ToolBehavior {
  onStart(agent: LayerImageAgent, args: ToolArgs) {
    return false;
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    return this.draw(agent, args, args.color);
  }

  draw(agent: LayerImageAgent, { position, lastPosition, size }: ToolArgs, color: RGBAColor) {
    if (!size) return false;

    const pbm = agent.getPixelBufferManager();
    const dm = agent.getDiffManager();

    drawSquarePixel(position, size, (px, py) => {
      if (!colorMatch(pbm.getPixel({ x: px, y: py }), color)) {
        const diff = agent.setPixel({ x: px, y: py }, color, true);
        if (diff !== undefined) {
          dm.add(diff);
        }
      }
    });

    if (lastPosition !== undefined) {
      drawCompletionLine(position, lastPosition, (x, y) => {
        drawSquarePixel({ x, y }, size, (px, py) => {
          if (!colorMatch(pbm.getPixel({ x: px, y: py }), color)) {
            const diff = agent.setPixel({ x: px, y: py }, color, true);
            if (diff !== undefined) {
              dm.add(diff);
            }
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
