import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { Vec2 } from '~/models/types/Vector';
import { ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';

export class MoveTool implements ToolBehavior {
  onlyOnCanvas = false;

  private startOffset: Vec2 = { x: 0, y: 0 };
  private startPosition: Vec2 = { x: 0, y: 0 };

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    this.startOffset = selectionManager.getMoveOffset();
    this.startPosition = args.position;
    return false;
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    const dx = args.position.x - this.startPosition.x;
    const dy = args.position.y - this.startPosition.y;
    selectionManager.moveTo({
      x: this.startOffset.x + dx,
      y: this.startOffset.y + dy,
    });
    return false;
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    return false;
  }
}
