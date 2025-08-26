import { scanline_flood_fill } from '@sledge/wasm';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { SelectionEditMode, selectionManager } from '~/controllers/selection/SelectionManager';
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
      eventBus.emit('selection:areaChanged', { commit: false });
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

  // WASM FloodFill をコピーBufferに対して実行し、変更されたピクセルを選択マスク(0/1)として返す
  private computeRegionMask(agent: LayerImageAgent, position: { x: number; y: number }, threshold: number): Uint8Array | undefined {
    const width = agent.getWidth();
    const height = agent.getHeight();
    if (width === 0 || height === 0) return undefined;

    // 元バッファをコピー
    const pbm = agent.getPixelBufferManager();
    const srcClamped = pbm.buffer; // Uint8ClampedArray
    const length = srcClamped.length;
    const before = new Uint8Array(length);
    before.set(srcClamped);

    // 作業用コピーに対してフラッドフィルを実行
    const work = new Uint8Array(length);
    work.set(before);

    // フィルカラー（元画像にあまり出ない色を選択）
    const fillR = 255, fillG = 0, fillB = 255, fillA = 255;
    const success = scanline_flood_fill(
      work,
      width,
      height,
      position.x,
      position.y,
      fillR,
      fillG,
      fillB,
      fillA,
      threshold ?? 0
    );

    if (!success) return new Uint8Array((width * height) | 0); // すべて0のマスク

    // 差分からマスクを生成（1ピクセル=1ビットではなく1byte: 0/1）
    const mask = new Uint8Array(width * height);
    for (let i = 0, p = 0; i < length; i += 4, p++) {
      const rChanged = work[i] !== before[i];
      const gChanged = work[i + 1] !== before[i + 1];
      const bChanged = work[i + 2] !== before[i + 2];
      const aChanged = work[i + 3] !== before[i + 3];
      mask[p] = rChanged || gChanged || bChanged || aChanged ? 1 : 0;
    }

    return mask;
  }
}
