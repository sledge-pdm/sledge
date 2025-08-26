import { Vec2 } from '@sledge/core';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { RectFragment, SelectionEditMode, selectionManager } from '~/controllers/selection/SelectionManager';
import { ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';

export class AutoSelection implements ToolBehavior {
  acceptStartOnOutCanvas = true;
  onlyOnCanvas = false;

  private startPosition: Vec2 = { x: 0, y: 0 };
  private startOffset: Vec2 = { x: 0, y: 0 }; // 移動開始時のオフセット

  getMode(e?: PointerEvent) {
    const isShiftPressed = e?.shiftKey;
    const isAltPressed = e?.altKey;
    const isCtrlPressed = e?.ctrlKey;

    let mode: SelectionEditMode = 'replace';
    if (isShiftPressed) mode = 'add';
    if (isAltPressed) mode = 'subtract';
    if (isCtrlPressed) mode = 'move';

    return mode;
  }

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    const mode = this.getMode(args.event);
    
    if (mode === 'move') {
      // 移動モードの場合
      this.startPosition = args.position;
      this.startOffset = selectionManager.getMoveOffset();
      // 移動開始
      selectionManager.setState('selected');
    } else {
      // 通常の選択モードの場合
      selectionManager.beginPreview(mode);
      this.startPosition = args.position;
      const newRect: RectFragment = {
        kind: 'rect',
        startPosition: this.startPosition,
        width: 1,
        height: 1,
      };
      selectionManager.setPreviewFragment(newRect);
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    const mode = this.getMode(args.event);

    if (mode === 'move') {
      // 移動モードの場合
      console.log('Moved from:', selectionManager.getMoveOffset());
      const dx = args.position.x - this.startPosition.x;
      const dy = args.position.y - this.startPosition.y;
      console.log('Moving to:', dx, dy);
      // 移動を適用
      selectionManager.moveTo({
        x: this.startOffset.x + dx,
        y: this.startOffset.y + dy,
      });
      console.log('Moved to:', selectionManager.getMoveOffset());
    } else {
      // 通常の選択モードの場合
      selectionManager.beginPreview(mode);

      const px = Math.max(0, args.position.x);
      const py = Math.max(0, args.position.y);
      const sx = Math.max(0, this.startPosition.x);
      const sy = Math.max(0, this.startPosition.y);

      const newRect: RectFragment = {
        kind: 'rect',
        startPosition: { x: 0, y: 0 },
        width: 0,
        height: 0,
      };
      const x0 = Math.min(sx, px);
      const y0 = Math.min(sy, py);
      newRect.startPosition.x = x0;
      newRect.startPosition.y = y0;
      newRect.width = Math.abs(px - sx) + 1;
      newRect.height = Math.abs(py - sy) + 1;

      selectionManager.setPreviewFragment(newRect);
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    const mode = this.getMode(args.event);

    if (mode === 'move') {
      // 移動モードの場合、移動をコミット
      selectionManager.commitOffset();
      // キャンバス外へ行くなどで選択範囲がなくなった場合は選択解除
      if (!selectionManager.isSelected()) {
        selectionManager.clear();
      } else {
        console.log('committed. offset:', selectionManager.getMoveOffset());
        selectionManager.setState('selected'); // 選択状態に戻す
      }
    } else {
      // 通常の選択モードの場合
      selectionManager.commit();
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onCancel(agent: LayerImageAgent, args: ToolArgs) {
    const mode = this.getMode(args.event);

    if (mode === 'move') {
      // 移動モードの場合、元の位置に戻す
      selectionManager.moveTo(this.startOffset);
      selectionManager.setState('selected');
    } else {
      // 通常の選択モードの場合
      selectionManager.commit();
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }
}
