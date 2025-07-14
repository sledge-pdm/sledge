import { Vec2 } from '@sledge/core';
import { preview_move } from '@sledge/wasm';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';
import { eventBus } from '~/utils/EventBus';

export class MoveTool implements ToolBehavior {
  onlyOnCanvas = false;

  private mode: 'layer' | 'selection' = 'selection';
  private originalBuffer: Uint8Array | undefined = undefined;

  private startPosition: Vec2 = { x: 0, y: 0 };

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    selectionManager.commit();
    selectionManager.commitOffset(); // かならずコミットしておく
    this.startPosition = args.position;
    this.originalBuffer = agent.getNonClampedBuffer().slice();
    return false;
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    const dx = args.position.x - this.startPosition.x;
    const dy = args.position.y - this.startPosition.y;

    selectionManager.setMoveOffset({ x: dx, y: dy });
    eventBus.emit('selection:moved', { newOffset: selectionManager.getMoveOffset() });

    try {
      const previewBuffer = preview_move(
        this.originalBuffer!,
        selectionManager.getSelectionMask().getMask(),
        dx,
        dy,
        agent.getWidth(),
        agent.getHeight()
      );
      agent.setBuffer(new Uint8ClampedArray(previewBuffer), false, true); // silentlySet=true
    } catch (error) {
      console.error('Move preview failed:', error);
      return false;
    }

    return false;
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    agent.getDiffManager().add({
      kind: 'whole',
      before: new Uint8ClampedArray(this.originalBuffer!),
      after: new Uint8ClampedArray(agent.getBuffer()),
    });
    this.originalBuffer = undefined; // 確定

    // 移動を確定（選択範囲の位置を更新）
    selectionManager.commitOffset();
    selectionManager.clear();
    return false;
  }

  // キャンセル処理　後で追加
}
