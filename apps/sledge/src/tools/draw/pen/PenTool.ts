import { Vec2 } from '@sledge/core';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { getPresetOf } from '~/controllers/tool/ToolController';
import { PixelDiff } from '~/models/history/HistoryManager';
import { ToolArgs, ToolBehavior, ToolResult } from '~/tools/ToolBehavior';
import { ToolCategoryId } from '~/tools/Tools';
import { colorMatch, RGBAColor } from '~/utils/ColorUtils';
import { drawCompletionLine, drawSquarePixel } from './PenDraw';

export class PenTool implements ToolBehavior {
  onlyOnCanvas = false; // 端の補完を確保するため画面外を許可

  startTime: number | undefined = undefined;
  isShift: boolean = false;
  isCtrl: boolean = false;
  private lastPreviewDiff: PixelDiff[] = [];

  startPosition: Vec2 | undefined = undefined;
  startPointerPosition: Vec2 | undefined = undefined;

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    // 前回の状態が残っている場合はクリーンアップ
    if (this.lastPreviewDiff.length > 0) {
      console.warn('PenTool: Cleaning up previous preview state');
      this.undoLastLineDiff(agent);
    }

    this.startTime = Date.now();
    this.isShift = args.event?.shiftKey ?? false;
    this.isCtrl = args.event?.ctrlKey ?? false;
    this.startPosition = args.position;
    if (args.event)
      this.startPointerPosition = {
        x: args.event.clientX,
        y: args.event.clientY,
      };

    this.lastPreviewDiff = [];

    if (!this.isShift) {
      return this.draw(agent, args, args.color);
    } else {
      return this.drawLine(false, agent, args, args.color);
    }
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    if (!this.isShift) {
      return this.draw(agent, args, args.color);
    } else {
      return this.drawLine(false, agent, args, args.color);
    }
  }

  protected categoryId: ToolCategoryId = 'pen';

  private SNAP_ANGLE = Math.PI / 12;

  private snapToAngle(current: Vec2, start: Vec2): Vec2 {
    const dx = current.x - start.x;
    const dy = current.y - start.y;
    const angle = Math.atan2(dy, dx);

    // 45度単位でスナップ
    const snapAngle = Math.round(angle / this.SNAP_ANGLE) * this.SNAP_ANGLE;
    const distance = Math.hypot(dx, dy);

    // console.log(`current=(${current.x}, ${current.y}), start=(${start.x}, ${start.y})`);
    // console.log(`position snapped to (${start.x + Math.cos(snapAngle) * distance}, ${start.y + Math.sin(snapAngle) * distance})`);

    return {
      x: Math.round(start.x + Math.cos(snapAngle) * distance),
      y: Math.round(start.y + Math.sin(snapAngle) * distance),
    };
  }

  draw(agent: LayerImageAgent, { position, lastPosition, presetName, event }: ToolArgs, color: RGBAColor): ToolResult {
    if (!presetName) return { shouldUpdate: false, shouldRegisterToHistory: false };

    const size = (getPresetOf(this.categoryId, presetName) as any)?.size ?? 1;

    const pbm = agent.getPixelBufferManager();
    const dm = agent.getDiffManager();

    const shouldCheckSelectionLimit = selectionManager.isSelected() && selectionManager.getSelectionLimitMode() !== 'none';
    drawSquarePixel(position, size, (px, py) => {
      if (shouldCheckSelectionLimit && !selectionManager.isDrawingAllowed({ x: px, y: py }, false)) {
        return; // 描画制限により描画しない
      }
      if (!colorMatch(pbm.getPixel({ x: px, y: py }), color)) {
        const diff = agent.setPixel({ x: px, y: py }, color, true);
        if (diff !== undefined) {
          dm.add(diff);
        }
      }
    });

    if (lastPosition !== undefined) {
      drawCompletionLine(position, lastPosition, (x, y) => {
        drawSquarePixel({ x, y }, size, (px, py) => {
          if (shouldCheckSelectionLimit && !selectionManager.isDrawingAllowed({ x: px, y: py }, false)) {
            return; // 描画制限により描画しない
          }
          if (!colorMatch(pbm.getPixel({ x: px, y: py }), color)) {
            const diff = agent.setPixel({ x: px, y: py }, color, true);
            if (diff !== undefined) {
              dm.add(diff);
            }
          }
        });
      });
    }

    return {
      shouldUpdate: true,
      shouldRegisterToHistory: false,
    };
  }

  private undoLastLineDiff(agent: LayerImageAgent) {
    const dm = agent.getDiffManager();
    // 前回のプレビューが残っていた場合はundo
    if (this.lastPreviewDiff.length > 0) {
      try {
        dm.add(this.lastPreviewDiff);
        dm.flush();
        agent.registerToHistory();
        agent.undo(true);
      } catch (error) {
        console.error('Failed to undo line preview:', error);
        // フォールバック: 手動でピクセルを復元
        this.lastPreviewDiff.forEach((diff) => {
          agent.setPixel(diff.position, diff.before, false);
        });
      } finally {
        this.lastPreviewDiff = [];
      }
    }
  }

  // 始点からの直線を描画
  drawLine(commit: boolean, agent: LayerImageAgent, { position, presetName, event }: ToolArgs, color: RGBAColor): ToolResult {
    if (!presetName || !this.startPosition) return { shouldUpdate: false, shouldRegisterToHistory: false };

    this.undoLastLineDiff(agent);

    // ctrl+shiftの場合は角度固定
    const targetPosition = this.isCtrl && this.startPosition ? this.snapToAngle(position, this.startPosition) : position;

    const size = (getPresetOf(this.categoryId, presetName) as any)?.size ?? 1;

    const pbm = agent.getPixelBufferManager();
    const dm = agent.getDiffManager();

    const shouldCheckSelectionLimit = selectionManager.isSelected() && selectionManager.getSelectionLimitMode() !== 'none';

    drawCompletionLine(targetPosition, this.startPosition, (x, y) => {
      drawSquarePixel({ x, y }, size, (px, py) => {
        if (shouldCheckSelectionLimit && !selectionManager.isDrawingAllowed({ x: px, y: py }, false)) {
          return; // 描画制限により描画しない
        }
        if (!colorMatch(pbm.getPixel({ x: px, y: py }), color)) {
          const diff = agent.setPixel({ x: px, y: py }, color, true);
          if (diff !== undefined) {
            if (commit) {
              dm.add(diff);
            } else {
              this.lastPreviewDiff?.push(diff);
            }
          }
        }
      });
    });

    return {
      shouldUpdate: true,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    if (this.isShift) {
      // 直線を確定
      this.drawLine(true, agent, args, args.color);
    }

    // 描画完了時にバッチを強制処理
    agent.getDiffManager().flush();
    const totalPx = agent.getDiffManager().getCurrent().diffs.size;
    const resultText =
      totalPx > 0
        ? `${this.categoryId} stroke done. (${this.startTime ? `${Date.now() - this.startTime}ms /` : ''} ${totalPx}px updated)`
        : undefined;

    this.isShift = false;
    this.isCtrl = false;
    this.startPosition = undefined;
    this.lastPreviewDiff = [];

    return {
      result: resultText,
      shouldUpdate: true,
      shouldRegisterToHistory: true,
    };
  }

  onCancel(agent: LayerImageAgent, args: ToolArgs) {
    if (this.isShift) {
      this.undoLastLineDiff(agent);
    }

    this.isShift = false;
    this.isCtrl = false;
    this.startPosition = undefined;
    // this.originalBuffer = undefined;
    this.startTime = undefined;

    this.lastPreviewDiff = [];

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }
}
