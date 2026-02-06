import { doCommands } from '~/features/history';
import { SelectionChangeCommand } from '~/features/history/command/selection/SelectionChangeCommand';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { SelectionBase } from '~/features/tools/behaviors/selection/SelectionBase';
import { ToolArgs } from '~/features/tools/behaviors/ToolBehavior';
import { getPresetOf } from '~/features/tools/ToolController';
import { SelectionEditMode } from '~/stores/editor/InteractStore';
import { auto_select_region_mask } from '~/utils/wasm';

export class AutoSelection extends SelectionBase {
  protected onStartSelection(args: ToolArgs, mode: SelectionEditMode) {
    // プレビュー開始（add/subtract/replaceをSelectionManagerに伝える）
    this.startPosition = args.position;

    const threshold = (args.presetName ? (getPresetOf('autoSelection', args.presetName) as any)?.threshold : undefined) ?? 0;

    // 領域選択マスクを生成してプレビューに反映
    const mask = this.computeRegionMask(args.layerId, args.position, threshold);
    if (!mask) return;

    const back = selectionManager.getBack();
    const layer = layerManager.getLayerOptional(args.layerId);
    const width = back?.getWidth() ?? layer?.getWidth() ?? 0;
    const height = back?.getHeight() ?? layer?.getHeight() ?? 0;
    if (!width || !height) return;

    let base: Uint8Array;
    if (mode === 'replace') {
      base = new Uint8Array(mask);
    } else {
      base = new Uint8Array(width * height);
      if (back) base.set(back.getMask());
      if (mode === 'add') {
        for (let i = 0; i < mask.length; i++) {
          if (mask[i] === 1) base[i] = 1;
        }
      } else if (mode === 'subtract') {
        for (let i = 0; i < mask.length; i++) {
          if (mask[i] === 1) base[i] = 0;
        }
      }
    }

    const front = new SelectionMask(width, height);
    front.setMask(base);
    selectionManager.setFront(front);
  }

  protected onMoveSelection(_args: ToolArgs, mode: SelectionEditMode) {
    // 現状、ドラッグ中にしきい値を変化させる等の動的更新は行わない
    // 将来的にホイールやドラッグ距離でthreshold変更→再計算を検討
  }

  protected onEndSelection(_args: ToolArgs, mode: SelectionEditMode) {
    doCommands(
      new SelectionChangeCommand({
        swapBack: selectionManager.getFront(),
      })
    );
  }

  protected onCancelSelection(_args: ToolArgs, mode: SelectionEditMode) {
    // 既存と同様、現状はcommit扱い（必要なら cancelPreview に変更）
    selectionManager.clearFront();
  }

  // 自動選択用 WASM を使って、選択マスク(0/1)を返す
  private computeRegionMask(layerId: string, position: { x: number; y: number }, threshold: number): Uint8Array | undefined {
    const layer = layerManager.getLayerOptional(layerId);
    if (!layer) return undefined;
    const width = layer.getWidth();
    const height = layer.getHeight();
    if (width === 0 || height === 0) return undefined;

    // 元バッファ（RGBA）を直接渡して WASM 側で領域抽出
    const buffer = layerManager.exportRawCanvas(layerId);
    const src = new Uint8Array(buffer.buffer); // RGBA buffer
    // connectivity は現状 4 固定（0を指定し内部で4接続扱い）
    const mask = auto_select_region_mask(src, width, height, position.x, position.y, threshold ?? 0, 4);
    return mask;
  }
}
