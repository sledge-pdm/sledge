import { Vec2 } from '@sledge-pdm/core';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logUserInfo } from '~/features/log/service';
import { FloatingBuffer, floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { extractSelectionBufferFromMask } from '~/features/selection/selectionBuffer';
import { ToolArgs, ToolBehavior, ToolResult } from '~/features/tools/behaviors/ToolBehavior';
import { projectStore } from '~/stores/RuntimeProjectStore';

export class MoveTool implements ToolBehavior {
  private startOffset: Vec2 = { x: 0, y: 0 };
  private startPosition: Vec2 = { x: 0, y: 0 };

  onStart(args: ToolArgs): ToolResult {
    if (!floatingMoveManager.isMoving()) {
      // 選択状態があれば選択範囲のバッファを、なければレイヤーを移動
      this.startMove();
    }

    this.startOffset = floatingMoveManager.getFloatingBuffer()?.offset ?? { x: 0, y: 0 };
    this.startPosition = args.position;

    return {
      shouldUpdate: false,
    };
  }

  onMove(args: ToolArgs): ToolResult {
    if (!floatingMoveManager.isMoving()) {
      return {
        shouldUpdate: false,
      };
    }

    const offsetFromStartX = args.position.x - this.startPosition.x;
    const offsetFromStartY = args.position.y - this.startPosition.y;

    if (offsetFromStartX === 0 && offsetFromStartY === 0)
      return {
        shouldUpdate: false,
      };

    const offset = { x: this.startOffset.x + offsetFromStartX, y: this.startOffset.y + offsetFromStartY };

    floatingMoveManager.moveTo(offset);

    return {
      shouldUpdate: false, // プレビュー更新は非同期で行うため、ここではfalse
    };
  }

  onEnd(args: ToolArgs): ToolResult {
    // commitは手動で行うのでここでは呼ばない
    // floatingMoveManager.commit();
    if (floatingMoveManager.isMoving()) {
      logUserInfo('Move tool drag finished. Commit or cancel to apply the change.');
    } else {
      logUserInfo('Move tool finished with no active selection.');
    }

    return {
      shouldUpdate: false,
    };
  }

  private startMove() {
    const layerId = projectStore.layers.state.activeLayerId;
    const width = projectStore.canvas.size.width;
    const height = projectStore.canvas.size.height;
    if (width == null || height == null) return;

    const back = selectionManager.getBack();
    const isSelectionMove = back && !back.isCleared();
    let selection: SelectionMask;
    if (isSelectionMove) {
      // move selection if available
      selection = cloneMask(back);
    } else {
      // otherwise select all (move layer)
      selection = new SelectionMask(width, height);
      selection.selectAll();
    }
    selectionManager.clearAll();
    const floating = this.buildFloatingBufferFromSelection(layerId, selection);
    if (!floating) {
      selectionManager.setBack(selection);
      return;
    }
    floatingMoveManager.startMove(floating, 'selection', layerId, selection);
  }

  private buildFloatingBufferFromSelection(layerId: string, selection: SelectionMask): FloatingBuffer | undefined {
    const { width, height } = projectStore.canvas.size;
    const mask = selection.getMask();
    const layerBuffer = layerManager.exportRawCanvas(layerId);
    const extracted = extractSelectionBufferFromMask(layerBuffer, mask, width, height);
    if (!extracted) return;

    const { buffer, bbox } = extracted;

    return {
      buffer,
      offset: { x: 0, y: 0 },
      width: bbox.width,
      height: bbox.height,
      origin: { x: bbox.x, y: bbox.y },
    };
  }
}

const cloneMask = (mask: SelectionMask): SelectionMask => {
  const cloned = new SelectionMask(mask.getWidth(), mask.getHeight());
  cloned.setMask(new Uint8Array(mask.getMask()));
  return cloned;
};
