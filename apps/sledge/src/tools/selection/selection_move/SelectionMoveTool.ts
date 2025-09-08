import { Vec2 } from '@sledge/core';
import LayerImageAgent from '~/features/layer/agent/LayerImageAgent';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { isSelectionAvailable } from '~/features/selection/SelectionOperator';
import { ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';

export class SelectionMoveTool implements ToolBehavior {
  acceptStartOnOutCanvas = true;
  onlyOnCanvas = false;
  isInstantTool = true;

  private startOffset: Vec2 = { x: 0, y: 0 };
  private startPosition: Vec2 = { x: 0, y: 0 };

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    this.startOffset = selectionManager.getAreaOffset();
    this.startPosition = args.position;
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    const dx = args.position.x - this.startPosition.x;
    const dy = args.position.y - this.startPosition.y;
    selectionManager.setOffset({
      x: this.startOffset.x + dx,
      y: this.startOffset.y + dy,
    });
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    // キャンバス外へ行くなどで選択範囲がなくなった場合は選択解除
    selectionManager.commitOffset();

    if (!isSelectionAvailable()) {
      selectionManager.clear();
    }

    console.log('committed. offset:', selectionManager.getAreaOffset());

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
      shouldReturnToPrevTool: !args.event?.shiftKey,
    };
  }
}
