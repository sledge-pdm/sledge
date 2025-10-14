import { Vec2 } from '@sledge/core';
// import LayerImageAgent from '~/features/layer/agent/LayerImageAgent'; // legacy
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { isSelectionAvailable, startMove } from '~/features/selection/SelectionOperator';
import { AnvilToolContext, ToolArgs, ToolBehavior } from '~/features/tools/behaviors/ToolBehavior';

export class MoveTool implements ToolBehavior {
  acceptStartOnOutCanvas = true;
  onlyOnCanvas = false;

  private startOffset: Vec2 = { x: 0, y: 0 };
  private startPosition: Vec2 = { x: 0, y: 0 };

  onStart(ctx: AnvilToolContext, args: ToolArgs) {
    selectionManager.commitOffset();
    selectionManager.commit();
    if (!floatingMoveManager.isMoving()) {
      console.log('start moving.');
      // 選択状態があれば選択範囲のバッファを、なければレイヤーを移動
      startMove();
    }

    this.startOffset = floatingMoveManager.getFloatingBuffer()?.offset ?? { x: 0, y: 0 };
    this.startPosition = args.position;

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onMove(ctx: AnvilToolContext, args: ToolArgs) {
    if (!isSelectionAvailable()) {
      return {
        shouldUpdate: false,
        shouldRegisterToHistory: false,
      };
    }

    const offsetFromStartX = args.position.x - this.startPosition.x;
    const offsetFromStartY = args.position.y - this.startPosition.y;

    if (offsetFromStartX === 0 && offsetFromStartY === 0)
      return {
        shouldUpdate: false,
        shouldRegisterToHistory: false,
      };

    const offset = { x: this.startOffset.x + offsetFromStartX, y: this.startOffset.y + offsetFromStartY };

    floatingMoveManager.moveTo(offset);

    return {
      shouldUpdate: false, // プレビュー更新は非同期で行うため、ここではfalse
      shouldRegisterToHistory: false,
    };
  }

  onEnd(ctx: AnvilToolContext, args: ToolArgs) {
    // commitは手動で行うのでここでは呼ばない
    // floatingMoveManager.commit();

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }
}
