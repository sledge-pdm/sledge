import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';
import { colorMatch, RGBAColor } from '~/utils/ColorUtils';
import { drawCompletionLine, drawSquarePixel } from '../../utils/DrawUtils';

export class PenTool implements ToolBehavior {
  onlyOnCanvas = false; // 端の補完を確保するため画面外を許可

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    // return false;
    return this.draw(agent, args, args.color);
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
    return true;
  }
}
