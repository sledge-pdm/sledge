import { fill_lasso_selection } from '@sledge/wasm';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { PartialFragment, selectionManager } from '~/features/selection/SelectionAreaManager';
import { SelectionBase } from '~/features/tools/behaviors/selection/SelectionBase';
import { ToolArgs } from '~/features/tools/behaviors/ToolBehavior';
import { getPresetOf } from '~/features/tools/ToolController';
import { LassoSelectionPresetConfig, TOOL_CATEGORIES } from '~/features/tools/Tools';
import { SelectionEditMode } from '~/stores/editor/InteractStore';
import { canvasStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';

export type LassoDisplayMode = 'fill' | 'outline';
export class LassoSelection extends SelectionBase {
  readonly categoryId = TOOL_CATEGORIES.LASSO_SELECTION;
  previewFragment: PartialFragment | undefined = undefined;
  private points: number[] = [];
  private lastUpdateTime = 0;
  private readonly UPDATE_INTERVAL = 16; // 60fps相当

  getDisplayMode(preset: LassoSelectionPresetConfig): LassoDisplayMode {
    if (canvasStore.canvas.width * canvasStore.canvas.height <= 1024 * 1024) return 'fill';

    return 'outline';
  }

  getPoints() {
    return this.points;
  }

  getPath(): string {
    if (this.points.length < 4) return '';

    let path = `M ${this.points[0]} ${this.points[1]}`;
    for (let i = 2; i < this.points.length; i += 2) {
      path += ` L ${this.points[i]} ${this.points[i + 1]}`;
    }
    // ポリゴンを閉じる
    if (this.points.length >= 6) {
      path += ' Z';
    }
    return path;
  }

  private calculateBoundingBox(points: number[], padding = 2): { x: number; y: number; width: number; height: number } {
    if (points.length < 2) {
      return { x: 0, y: 0, width: 1, height: 1 };
    }

    let minX = points[0];
    let maxX = points[0];
    let minY = points[1];
    let maxY = points[1];

    for (let i = 2; i < points.length; i += 2) {
      const x = points[i];
      const y = points[i + 1];
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    // パディングを追加してバウンディングボックスを拡張
    const x = Math.floor(minX) - padding;
    const y = Math.floor(minY) - padding;
    const width = Math.ceil(maxX) - Math.floor(minX) + padding * 2;
    const height = Math.ceil(maxY) - Math.floor(minY) + padding * 2;

    return { x: Math.max(0, x), y: Math.max(0, y), width: Math.max(1, width), height: Math.max(1, height) };
  }

  private updatePartialMask(anvil: any, mode: 'nonzero' | 'evenodd'): void {
    if (!this.previewFragment || this.points.length < 6) return;

    const bbox = this.calculateBoundingBox(this.points);

    // バウンディングボックスをキャンバス範囲内に制限
    const canvasWidth = anvil.getWidth();
    const canvasHeight = anvil.getHeight();
    const clampedX = Math.max(0, Math.min(bbox.x, canvasWidth - 1));
    const clampedY = Math.max(0, Math.min(bbox.y, canvasHeight - 1));
    const clampedWidth = Math.min(bbox.width, canvasWidth - clampedX);
    const clampedHeight = Math.min(bbox.height, canvasHeight - clampedY);

    // 新しいバウンディングボックスまたはサイズが変わった場合はマスクを再作成
    if (
      this.previewFragment.x !== clampedX ||
      this.previewFragment.y !== clampedY ||
      this.previewFragment.width !== clampedWidth ||
      this.previewFragment.height !== clampedHeight
    ) {
      this.previewFragment = {
        kind: 'partial',
        partialMask: new Uint8Array(clampedWidth * clampedHeight),
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
      };
    } else {
      // 同じサイズの場合はクリアのみ
      this.previewFragment.partialMask.fill(0);
    }

    // 座標をローカル座標系に変換
    const localPoints = [];
    for (let i = 0; i < this.points.length; i += 2) {
      localPoints.push(this.points[i] - clampedX, this.points[i + 1] - clampedY);
    }

    // WASM関数を使用してマスクを更新
    try {
      fill_lasso_selection(this.previewFragment.partialMask, clampedWidth, clampedHeight, new Float32Array(localPoints), mode);
    } catch (error) {
      console.warn('Lasso selection WASM call failed:', error);
    }
  }

  protected onStartSelection(args: ToolArgs, mode: SelectionEditMode) {
    selectionManager.beginPreview(mode);
    this.startPosition = args.position;

    const anvil = getAnvilOf(args.layerId);
    if (!anvil) return;

    // 座標追跡を初期化
    this.points = [args.position.x, args.position.y];
    this.lastUpdateTime = performance.now();

    // 初期状態では1点のみなので、小さな初期バウンディングボックスを作成
    this.previewFragment = {
      kind: 'partial',
      partialMask: new Uint8Array(1),
      x: Math.floor(args.position.x),
      y: Math.floor(args.position.y),
      width: 1,
      height: 1,
    };

    const preset = getPresetOf(TOOL_CATEGORIES.LASSO_SELECTION, args.presetName ?? 'default') as LassoSelectionPresetConfig;
    const displayMode = this.getDisplayMode(preset);
    if (displayMode === 'fill') {
      selectionManager.setPreviewFragment(this.previewFragment);
    } else {
      eventBus.emit('selection:updateLassoOutline', {});
    }
  }

  protected onMoveSelection(args: ToolArgs, mode: SelectionEditMode) {
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

    const preset = getPresetOf(TOOL_CATEGORIES.LASSO_SELECTION, args.presetName ?? 'default') as LassoSelectionPresetConfig;
    const displayMode = this.getDisplayMode(preset);
    const fillMode = preset.fillMode ?? 'nonzero';
    if (displayMode === 'fill') {
      // 最低3点必要（線分を作るため）
      if (this.points.length >= 6) {
        this.updatePartialMask(anvil, fillMode);
      }

      selectionManager.setPreviewFragment(this.previewFragment);
    } else {
      eventBus.emit('selection:updateLassoOutline', {});
    }
  }

  protected onEndSelection(args: ToolArgs, mode: SelectionEditMode) {
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

      const preset = getPresetOf(TOOL_CATEGORIES.LASSO_SELECTION, args.presetName ?? 'default') as LassoSelectionPresetConfig;
      const fillMode = preset.fillMode ?? 'nonzero';
      // 最終マスクを生成
      this.updatePartialMask(anvil, fillMode);
    }

    this.points = [];
    eventBus.emit('selection:updateLassoOutline', {});

    selectionManager.setPreviewFragment(this.previewFragment);
    selectionManager.commit();
  }

  protected onCancelSelection(_args: ToolArgs, mode: SelectionEditMode) {
    // 座標をクリア
    this.points = [];
    selectionManager.commit();
  }
}
