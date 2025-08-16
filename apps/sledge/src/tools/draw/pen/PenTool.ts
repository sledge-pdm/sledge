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

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    this.startTime = Date.now();
    return this.draw(agent, args, args.color);
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    return this.draw(agent, args, args.color);
  }

  protected categoryId: ToolCategoryId = 'pen';

  draw(agent: LayerImageAgent, { position, lastPosition, presetName }: ToolArgs, color: RGBAColor): ToolResult {
    if (!presetName) return { shouldUpdate: false, shouldRegisterToHistory: false };

    const size = (getPresetOf(this.categoryId, presetName) as any)?.size ?? 1;

    const pbm = agent.getPixelBufferManager();
    const dm = agent.getDiffManager();

    drawSquarePixel(position, size, (px, py) => {
      if (!selectionManager.isDrawingAllowed({ x: px, y: py })) {
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
      const shouldCheckSelectionLimit = selectionManager.isSelected() && selectionManager.getSelectionLimitMode() !== 'none';
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

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    // 描画完了時にバッチを強制処理
    agent.getDiffManager().flush();
    const totalPx = agent.getDiffManager().getCurrent().diffs.size;
    const resultText = `${this.categoryId} stroke done. (${this.startTime ? `${Date.now() - this.startTime}ms /` : ''} ${totalPx}px updated)`;
    return {
      result: resultText,
      shouldUpdate: true,
      shouldRegisterToHistory: true,
    };
  }
}
