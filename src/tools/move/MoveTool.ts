import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { ToolArgs, ToolBehavior } from '~/tools/ToolBase';
import { Vec2 } from '~/types/Vector';

export class MoveTool implements ToolBehavior {
  private startOffset: Vec2 = { x: 0, y: 0 };
  private startPosition: Vec2 = { x: 0, y: 0 };

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    this.startOffset = selectionManager.getMoveOffset();
    this.startPosition = args.position;
    selectionManager.setMoveOffset(this.startPosition);
    return false;
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    const dx = args.position.x - this.startPosition.x;
    const dy = args.position.y - this.startPosition.y;
    console.log(dx, dy);
    selectionManager.setMoveOffset({
      x: this.startOffset.x + dx,
      y: this.startOffset.y + dy,
    });
    return false;
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    // commit
    return false;
  }
}
