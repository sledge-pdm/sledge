import { auto_select_region_mask } from '@sledge/wasm';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { SelectionEditMode, selectionManager } from '~/controllers/selection/SelectionAreaManager';
import { getPresetOf } from '~/controllers/tool/ToolController';
import { ToolArgs } from '~/tools/ToolBehavior';
import { SelectionBase } from '~/tools/selection/SelectionBase';
import { eventBus } from '~/utils/EventBus';

export class AutoSelection extends SelectionBase {
  protected onStartSelection(agent: LayerImageAgent, args: ToolArgs, mode: SelectionEditMode) {
    // プレビュー開始（add/subtract/replaceをSelectionManagerに伝える）
    selectionManager.beginPreview(mode);
    this.startPosition = args.position;

    const threshold = (args.presetName ? (getPresetOf('autoSelection', args.presetName) as any)?.threshold : undefined) ?? 0;

    // 領域選択マスクを生成してプレビューに反映
    const mask = this.computeRegionMask(agent, args.position, threshold);
    const preview = selectionManager.getPreviewMask();
    if (preview && mask) {
      preview.setMask(mask);
      // プレビュー更新イベント（UI反映用）
      eventBus.emit('selection:maskChanged', { commit: false });
    }
  }

  protected onMoveSelection(agent: LayerImageAgent, args: ToolArgs, mode: SelectionEditMode) {
    // 現状、ドラッグ中にしきい値を変化させる等の動的更新は行わない
    // 将来的にホイールやドラッグ距離でthreshold変更→再計算を検討
  }

  protected onEndSelection(agent: LayerImageAgent, args: ToolArgs, mode: SelectionEditMode) {
    selectionManager.commit();
  }

  protected onCancelSelection(agent: LayerImageAgent, args: ToolArgs, mode: SelectionEditMode) {
    // 既存と同様、現状はcommit扱い（必要なら cancelPreview に変更）
    selectionManager.commit();
  }

  // 自動選択用 WASM を使って、選択マスク(0/1)を返す
  private computeRegionMask(agent: LayerImageAgent, position: { x: number; y: number }, threshold: number): Uint8Array | undefined {
    const width = agent.getWidth();
    const height = agent.getHeight();
    if (width === 0 || height === 0) return undefined;

    // 元バッファ（RGBA）を直接渡して WASM 側で領域抽出
    const pbm = agent.getPixelBufferManager();
    const src = new Uint8Array(pbm.buffer.buffer); // RGBA buffer
    // connectivity は現状 4 固定（0を指定し内部で4接続扱い）
    const mask = auto_select_region_mask(src, width, height, position.x, position.y, threshold ?? 0, 4);
    return mask;
  }
}
