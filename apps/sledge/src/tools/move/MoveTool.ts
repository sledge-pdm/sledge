import { Vec2 } from '@sledge/core';
import { preview_move } from '@sledge/wasm';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';
import { eventBus } from '~/utils/EventBus';

export class MoveTool implements ToolBehavior {
  onlyOnCanvas = false;

  private layerId: string | undefined = undefined;
  private originalBuffer: Uint8Array | undefined = undefined;

  private startOffset: Vec2 = { x: 0, y: 0 };
  private startPosition: Vec2 = { x: 0, y: 0 };

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    const isLayerMove = selectionManager.getState() === 'move_layer' || !selectionManager.isSelected();
    if (isLayerMove) {
      selectionManager.selectAll();
    }
    this.layerId = agent.layerId;

    selectionManager.commit();

    if (!selectionManager.isMoveState()) {
      selectionManager.commitOffset();
      this.startOffset = selectionManager.getMoveOffset();
      this.startPosition = args.position;
      this.originalBuffer = agent.getNonClampedBuffer().slice();
    } else {
      // sequential move
    }

    selectionManager.setState(isLayerMove ? 'move_layer' : 'move_selection');

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    if (!selectionManager.isSelected())
      return {
        shouldUpdate: false,
        shouldRegisterToHistory: false,
      };
    const dx = args.position.x - this.startPosition.x;
    const dy = args.position.y - this.startPosition.y;
    const offset = selectionManager.getMoveOffset();

    if (dx === offset.x && dy === offset.y)
      return {
        shouldUpdate: false,
        shouldRegisterToHistory: false,
      };
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
      agent.setBuffer(new Uint8ClampedArray(previewBuffer.buffer), true, false);
    } catch (error) {
      console.error('Move preview failed:', error);
      return {
        shouldUpdate: false,
        shouldRegisterToHistory: false,
      };
    }

    return {
      shouldUpdate: true,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  commit() {
    if (!this.layerId || !this.originalBuffer) return;
    const agent = getAgentOf(this.layerId);
    if (!agent) return;

    agent.getDiffManager().add({
      kind: 'whole',
      before: new Uint8ClampedArray(this.originalBuffer.buffer),
      after: new Uint8ClampedArray(agent.getBuffer()),
    });
    this.originalBuffer = undefined;

    agent.registerToHistory();
    agent.forceUpdate();

    selectionManager.commit();
    selectionManager.commitOffset();
    selectionManager.clear();
  }

  cancel() {
    if (!this.layerId || !this.originalBuffer) return;
    const agent = getAgentOf(this.layerId);
    if (!agent) return;

    if (this.originalBuffer) {
      // 元のバッファに戻す
      agent.setBuffer(new Uint8ClampedArray(this.originalBuffer), true, true);
      this.originalBuffer = undefined;
    }
    agent.forceUpdate();

    // 移動オフセットをリセット
    selectionManager.setMoveOffset(this.startOffset);
    eventBus.emit('selection:moved', { newOffset: this.startOffset });
    selectionManager.setState('selected');
  }
}
