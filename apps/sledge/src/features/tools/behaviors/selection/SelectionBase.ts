import { Vec2 } from '@sledge/core';
import { logUserInfo } from '~/features/log/service';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { isSelectionAvailable } from '~/features/selection/SelectionOperator';
import { ToolArgs, ToolBehavior, ToolResult } from '~/features/tools/behaviors/ToolBehavior';
import { SelectionEditMode } from '~/stores/editor/InteractStore';
import { interactStore, setInteractStore } from '~/stores/EditorStores';

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

    let mode: SelectionEditMode = interactStore.selectionEditMode;
    if (isShiftPressed) mode = 'add';
    if (isAltPressed) mode = 'subtract';
    if (isCtrlPressed) mode = 'move';

    return mode;
  }

  movePrevMode: SelectionEditMode | undefined = undefined;

  onStart(args: ToolArgs): ToolResult {
    const mode = this.getMode(args.event);

    if (mode === 'move') {
      // 移動モード開始
      this.startPosition = args.position;
      this.startOffset = selectionManager.getAreaOffset();
      selectionManager.setState('selected');
      this.movePrevMode = interactStore.selectionEditMode;
      setInteractStore('selectionEditMode', 'move');
    } else {
      // ツール固有の選択開始処理
      this.onStartSelection(args, mode);
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onMove(args: ToolArgs): ToolResult {
    const mode = this.getMode(args.event);

    if (mode === 'move') {
      // 移動中のオフセットを反映
      const dx = args.position.x - this.startPosition.x;
      const dy = args.position.y - this.startPosition.y;
      selectionManager.setOffset({ x: this.startOffset.x + dx, y: this.startOffset.y + dy });
    } else {
      // ツール固有の選択更新処理
      this.onMoveSelection(args, mode);
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(args: ToolArgs): ToolResult {
    const mode = this.getMode(args.event);
    let message: string | undefined;

    if (mode === 'move') {
      if (this.movePrevMode) setInteractStore('selectionEditMode', this.movePrevMode);
      // 移動確定
      selectionManager.commitOffset();
      if (!isSelectionAvailable()) {
        selectionManager.clear();
        message = 'Selection cleared.';
      } else {
        selectionManager.setState('selected');
        message = 'Selection moved.';
      }
    } else {
      // ツール固有の確定処理
      this.onEndSelection(args, mode);
      switch (mode) {
        case 'add':
          message = 'Selection added.';
          break;
        case 'subtract':
          message = 'Selection subtracted.';
          break;
        default:
          message = 'Selection updated.';
          break;
      }
    }

    if (message) {
      logUserInfo(message);
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onCancel(args: ToolArgs): ToolResult {
    const mode = this.getMode(args.event);

    if (mode === 'move') {
      if (this.movePrevMode) setInteractStore('selectionEditMode', this.movePrevMode);
      // 位置を元に戻す
      selectionManager.setOffset(this.startOffset);
      selectionManager.setState('selected');
    } else {
      // ツール固有のキャンセル処理
      this.onCancelSelection(args, mode);
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  // 派生クラスで実装する選択系処理（矩形・自動等）
  protected abstract onStartSelection(args: ToolArgs, mode: SelectionEditMode): void;
  protected abstract onMoveSelection(args: ToolArgs, mode: SelectionEditMode): void;
  protected abstract onEndSelection(args: ToolArgs, mode: SelectionEditMode): void;
  protected abstract onCancelSelection(args: ToolArgs, mode: SelectionEditMode): void;
}
