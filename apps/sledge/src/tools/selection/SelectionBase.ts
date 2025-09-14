import { Vec2 } from '@sledge/core';
import LayerImageAgent from '~/features/layer/agent/LayerImageAgent';
import { SelectionEditMode, selectionManager } from '~/features/selection/SelectionAreaManager';
import { isSelectionAvailable } from '~/features/selection/SelectionOperator';
import { ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';

// 共通のモード判定と ctrl+ドラッグ移動処理をまとめたベースクラス
// 各選択ツールは selection-mode（矩形/自動等）のみを実装すればよい
export abstract class SelectionBase implements ToolBehavior {
  acceptStartOnOutCanvas = true;
  onlyOnCanvas = false;

  protected startPosition: Vec2 = { x: 0, y: 0 };
  protected startOffset: Vec2 = { x: 0, y: 0 }; // 移動開始時のオフセット

  protected getMode(e?: PointerEvent): SelectionEditMode {
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
      // 移動モード開始
      this.startPosition = args.position;
      this.startOffset = selectionManager.getAreaOffset();
      selectionManager.setState('selected');
    } else {
      // ツール固有の選択開始処理
      this.onStartSelection(agent, args, mode);
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    const mode = this.getMode(args.event);

    if (mode === 'move') {
      // 移動中のオフセットを反映
      const dx = args.position.x - this.startPosition.x;
      const dy = args.position.y - this.startPosition.y;
      selectionManager.setOffset({ x: this.startOffset.x + dx, y: this.startOffset.y + dy });
    } else {
      // ツール固有の選択更新処理
      this.onMoveSelection(agent, args, mode);
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    const mode = this.getMode(args.event);

    if (mode === 'move') {
      // 移動確定
      selectionManager.commitOffset();
      if (!isSelectionAvailable()) {
        selectionManager.clear();
      } else {
        selectionManager.setState('selected');
      }
    } else {
      // ツール固有の確定処理
      this.onEndSelection(agent, args, mode);
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onCancel(agent: LayerImageAgent, args: ToolArgs) {
    const mode = this.getMode(args.event);

    if (mode === 'move') {
      // 位置を元に戻す
      selectionManager.setOffset(this.startOffset);
      selectionManager.setState('selected');
    } else {
      // ツール固有のキャンセル処理
      this.onCancelSelection(agent, args, mode);
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  // 派生クラスで実装する選択系処理（矩形・自動等）
  protected abstract onStartSelection(agent: LayerImageAgent, args: ToolArgs, mode: SelectionEditMode): void;
  protected abstract onMoveSelection(agent: LayerImageAgent, args: ToolArgs, mode: SelectionEditMode): void;
  protected abstract onEndSelection(agent: LayerImageAgent, args: ToolArgs, mode: SelectionEditMode): void;
  protected abstract onCancelSelection(agent: LayerImageAgent, args: ToolArgs, mode: SelectionEditMode): void;
}
