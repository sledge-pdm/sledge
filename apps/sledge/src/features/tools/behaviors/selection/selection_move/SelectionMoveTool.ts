import { Vec2 } from '@sledge/core';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { isSelectionAvailable } from '~/features/selection/SelectionOperator';
import { AnvilToolContext, ToolArgs, ToolBehavior } from '~/features/tools/behaviors/ToolBehavior';

export class SelectionMoveTool implements ToolBehavior {
  acceptStartOnOutCanvas = true;
  onlyOnCanvas = false;
  isInstantTool = true;

  private startOffset: Vec2 = { x: 0, y: 0 };
  private startPosition: Vec2 = { x: 0, y: 0 };

  onStart(_ctx: AnvilToolContext, args: ToolArgs) {
    this.startOffset = selectionManager.getAreaOffset();
    this.startPosition = args.position;
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onMove(_ctx: AnvilToolContext, args: ToolArgs) {
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

  onEnd(_ctx: AnvilToolContext, args: ToolArgs) {
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
