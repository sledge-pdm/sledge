import { Size2D } from '@sledge/core';
import { adjustZoomToFit } from '~/features/canvas';
import { allLayers, resetLayerImage } from '~/features/layer';
// Anvil 移行: 旧 Agent API 依存を排除し Anvil バッファを直接扱う
import { getBufferCopy } from '~/features/layer/anvil/AnvilController';
import { anvilManager, getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { canvasStore, setCanvasStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { BaseHistoryAction } from '../base';

type LayerBufferSnapshot = { layerId: string; dotMag: number; buffer: Uint8ClampedArray };

// history action for canvas size changes including full buffer restoration per layer
export class CanvasSizeHistoryAction extends BaseHistoryAction {
  readonly type = 'canvas_size' as const;

  constructor(
    public readonly oldSize: Size2D,
    public readonly newSize: Size2D,
    context?: any
  ) {
    super(context);
    // Snapshot all layers' buffers for the old size immediately
    this.oldSnapshots = allLayers().map((l) => {
      // 既存 Anvil からバッファ取得; 無ければ現在キャンバスサイズ基準で空バッファ
      const buf = getBufferCopy(l.id);
      const w = Math.round(canvasStore.canvas.width / l.dotMagnification);
      const h = Math.round(canvasStore.canvas.height / l.dotMagnification);
      return {
        layerId: l.id,
        dotMag: l.dotMagnification,
        buffer: buf ? new Uint8ClampedArray(buf) : new Uint8ClampedArray(w * h * 4),
      };
    });
  }

  private oldSnapshots: LayerBufferSnapshot[] = [];
  private newSnapshots?: LayerBufferSnapshot[];

  undo(): void {
    this.applyState(this.oldSize, this.oldSnapshots);
  }

  redo(): void {
    // On first redo, capture "new" snapshots after resizing once
    if (!this.newSnapshots) {
      // 初回: 新サイズ適用 → 空/リサイズ後バッファをスナップショット化 → そのスナップショットから復元（形だけ）
      this.applyCanvasSize(this.newSize);
      this.resizeAllLayers(this.newSize);
      this.newSnapshots = allLayers().map((l) => {
        const buf = getBufferCopy(l.id);
        const w = Math.round(this.newSize.width / l.dotMagnification);
        const h = Math.round(this.newSize.height / l.dotMagnification);
        return {
          layerId: l.id,
          dotMag: l.dotMagnification,
          buffer: buf ? new Uint8ClampedArray(buf) : new Uint8ClampedArray(w * h * 4),
        };
      });
      this.restoreSnapshots(this.newSize, this.newSnapshots);
    } else {
      this.applyState(this.newSize, this.newSnapshots);
    }
  }

  private applyState(size: Size2D, snapshots: LayerBufferSnapshot[]) {
    this.applyCanvasSize(size);
    this.resizeAllLayers(size);
    this.restoreSnapshots(size, snapshots);
  }

  private resizeAllLayers(size: Size2D) {
    const layers = allLayers();
    layers.forEach((l) => {
      const newW = Math.round(size.width / l.dotMagnification);
      const newH = Math.round(size.height / l.dotMagnification);
      const existing = getAnvilOf(l.id);
      // サイズ変化が無ければ何もしない
      if (existing) {
        // 既存サイズを推測できない（外部API非公開）ため単純に再登録（既存ピクセルは保持しない）
        // FIXME: 既存ピクセルをコピーする最適化は Anvil API 追加後に対応
        const blank = new Uint8ClampedArray(newW * newH * 4);
        anvilManager.registerAnvil(l.id, blank, newW, newH);
      } else {
        const blank = new Uint8ClampedArray(newW * newH * 4);
        anvilManager.registerAnvil(l.id, blank, newW, newH);
      }
    });
  }

  private applyCanvasSize(size: Size2D) {
    setCanvasStore('canvas', size);
    adjustZoomToFit();
    eventBus.emit('canvas:sizeChanged', { newSize: size });
  }

  private restoreSnapshots(size: Size2D, snapshots: LayerBufferSnapshot[]) {
    for (const snap of snapshots) {
      resetLayerImage(snap.layerId, snap.dotMag, snap.buffer);
    }
  }
}
