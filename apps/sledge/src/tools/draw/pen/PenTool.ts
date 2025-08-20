import { Vec2 } from '@sledge/core';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { getPresetOf } from '~/controllers/tool/ToolController';
import { ToolArgs, ToolBehavior, ToolResult } from '~/tools/ToolBehavior';
import { ToolCategoryId } from '~/tools/Tools';
import { colorMatch, RGBAColor } from '~/utils/ColorUtils';
import { drawCompletionLine, drawSquarePixel } from '../../../utils/DrawUtils';

export class PenTool implements ToolBehavior {
  onlyOnCanvas = false; // 端の補完を確保するため画面外を許可

  startTime: number | undefined = undefined;
  isShift: boolean = false;
  private originalBuffer: Uint8ClampedArray | undefined = undefined;
  private previewBuffer: Uint8ClampedArray | undefined = undefined;

  startPosition: Vec2 | undefined = undefined;

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    this.startTime = Date.now();
    this.isShift = args.event?.shiftKey ?? false;
    this.startPosition = args.position;
    this.originalBuffer = new Uint8ClampedArray(agent.getBuffer());

    return this.draw(agent, args, args.color);
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    if (!this.isShift) {
      return this.draw(agent, args, args.color);
    } else {
      return this.drawLine(false, agent, args, args.color);
    }
  }

  protected categoryId: ToolCategoryId = 'pen';

  draw(agent: LayerImageAgent, { position, lastPosition, presetName }: ToolArgs, color: RGBAColor): ToolResult {
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

  // 始点からの直線を描画
  drawLine(saveDiff: boolean, agent: LayerImageAgent, { position, presetName }: ToolArgs, color: RGBAColor): ToolResult {
    if (!presetName || !this.startPosition || !this.originalBuffer) return { shouldUpdate: false, shouldRegisterToHistory: false };

    if (!this.previewBuffer || this.previewBuffer.length !== this.originalBuffer.length) {
      this.previewBuffer = new Uint8ClampedArray(this.originalBuffer.length);
    }
    this.previewBuffer.set(this.originalBuffer);

    const previewBuffer = new Uint8ClampedArray(this.originalBuffer);

    const size = (getPresetOf(this.categoryId, presetName) as any)?.size ?? 1;

    const pbm = agent.getPixelBufferManager();
    const dm = agent.getDiffManager();

    const shouldCheckSelectionLimit = selectionManager.isSelected() && selectionManager.getSelectionLimitMode() !== 'none';

    drawCompletionLine(position, this.startPosition, (x, y) => {
      drawSquarePixel({ x, y }, size, (px, py) => {
        if (shouldCheckSelectionLimit && !selectionManager.isDrawingAllowed({ x: px, y: py }, false)) {
          return; // 描画制限により描画しない
        }
        const idx = (py * agent.getWidth() + px) * 4;
        const beforeColor: RGBAColor = [previewBuffer[idx], previewBuffer[idx + 1], previewBuffer[idx + 2], previewBuffer[idx + 3]];
        if (!colorMatch(beforeColor, color) && pbm.isInBounds({ x: px, y: py })) {
          previewBuffer[idx] = color[0];
          previewBuffer[idx + 1] = color[1];
          previewBuffer[idx + 2] = color[2];
          previewBuffer[idx + 3] = color[3];
          if (saveDiff) {
            dm.add({
              kind: 'pixel',
              position: { x: px, y: py },
              before: beforeColor,
              after: color,
            });
          }
        }
      });
    });

    agent.setBuffer(previewBuffer, true, false);

    return {
      shouldUpdate: true,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    if (this.isShift) {
      // 直線を確定
      this.drawLine(true, agent, args, args.color);
      this.originalBuffer = undefined;
    }

    // 描画完了時にバッチを強制処理
    agent.getDiffManager().flush();
    const totalPx = agent.getDiffManager().getCurrent().diffs.size;
    const resultText =
      totalPx > 0
        ? `${this.categoryId} stroke done. (${this.startTime ? `${Date.now() - this.startTime}ms /` : ''} ${totalPx}px updated)`
        : undefined;

    this.isShift = false;
    this.startPosition = undefined;

    return {
      result: resultText,
      shouldUpdate: true,
      shouldRegisterToHistory: true,
    };
  }

  onCancel(agent: LayerImageAgent, args: ToolArgs) {
    this.isShift = false;
    this.startPosition = undefined;
    this.originalBuffer = undefined;
    this.startTime = undefined;

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }
}
