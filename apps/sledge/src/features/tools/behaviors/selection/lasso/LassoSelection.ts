import { fill_lasso_selection } from '@sledge/wasm';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { SelectionEditMode, selectionManager, WholeFragment } from '~/features/selection/SelectionAreaManager';
import { AnvilToolContext, ToolArgs } from '~/features/tools/behaviors/ToolBehavior';
import { SelectionBase } from '~/features/tools/behaviors/selection/SelectionBase';

export class LassoSelection extends SelectionBase {
  previewFragment: WholeFragment | undefined = undefined;
  private points: number[] = [];
  private lastUpdateTime = 0;
  private readonly UPDATE_INTERVAL = 16; // 60fps相当

  protected onStartSelection(_ctx: AnvilToolContext, args: ToolArgs, mode: SelectionEditMode) {
    selectionManager.beginPreview(mode);
    this.startPosition = args.position;

    const anvil = getAnvilOf(args.layerId);
    if (!anvil) return;

    // 座標追跡を初期化
    this.points = [args.position.x, args.position.y];
    this.lastUpdateTime = performance.now();

    // マスクバッファを初期化
    this.previewFragment = { kind: 'whole', mask: new Uint8Array(anvil.getWidth() * anvil.getHeight()) };

    selectionManager.setPreviewFragment(this.previewFragment);
  }

  protected onMoveSelection(_ctx: AnvilToolContext, args: ToolArgs, mode: SelectionEditMode) {
    if (!this.previewFragment) return;

    const anvil = getAnvilOf(args.layerId);
    if (!anvil) return;

    // フレームレート制限による最適化
    const currentTime = performance.now();
    if (currentTime - this.lastUpdateTime < this.UPDATE_INTERVAL) {
      return;
    }
    this.lastUpdateTime = currentTime;

    // 新しい点を追加（距離チェックによる間引き）
    const lastX = this.points[this.points.length - 2];
    const lastY = this.points[this.points.length - 1];
    const distance = Math.sqrt(Math.pow(args.position.x - lastX, 2) + Math.pow(args.position.y - lastY, 2));

    // 最小距離フィルタ（1ピクセル未満の移動は無視）
    if (distance >= 1.0) {
      this.points.push(args.position.x, args.position.y);
    }

    // 最低3点必要（線分を作るため）
    if (this.points.length >= 6) {
      // マスクをクリア
      this.previewFragment.mask.fill(0);

      // WASM関数を使用してマスクを更新
      try {
        fill_lasso_selection(this.previewFragment.mask, anvil.getWidth(), anvil.getHeight(), new Float32Array(this.points));
      } catch (error) {
        console.warn('Lasso selection WASM call failed:', error);
      }
    }

    selectionManager.setPreviewFragment(this.previewFragment);
  }

  protected onEndSelection(_ctx: AnvilToolContext, args: ToolArgs, mode: SelectionEditMode) {
    if (!this.previewFragment) return;

    const anvil = getAnvilOf(args.layerId);
    if (!anvil) {
      selectionManager.commit();
      return;
    }

    // 最終的なマスクを生成（ポリゴンを閉じるため）
    if (this.points.length >= 6) {
      // 最後の点が開始点と異なる場合は開始点を追加してポリゴンを閉じる
      const startX = this.points[0];
      const startY = this.points[1];
      const lastX = this.points[this.points.length - 2];
      const lastY = this.points[this.points.length - 1];

      const distance = Math.sqrt(Math.pow(startX - lastX, 2) + Math.pow(startY - lastY, 2));

      if (distance > 2.0) {
        this.points.push(startX, startY);
      }

      // 最終マスクを生成
      this.previewFragment.mask.fill(0);
      try {
        fill_lasso_selection(this.previewFragment.mask, anvil.getWidth(), anvil.getHeight(), new Float32Array(this.points));
      } catch (error) {
        console.warn('Final lasso selection WASM call failed:', error);
      }
    }

    selectionManager.setPreviewFragment(this.previewFragment);
    selectionManager.commit();
  }

  protected onCancelSelection(_ctx: AnvilToolContext, args: ToolArgs, mode: SelectionEditMode) {
    // 座標をクリア
    this.points = [];
    selectionManager.commit();
  }
}
