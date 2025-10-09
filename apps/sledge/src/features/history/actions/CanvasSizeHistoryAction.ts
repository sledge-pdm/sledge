import { rawToWebp, webpToRaw } from '@sledge/anvil';
import { Size2D } from '@sledge/core';
import { adjustZoomToFit } from '~/features/canvas';
import { allLayers } from '~/features/layer';
import { getBufferCopy } from '~/features/layer/anvil/AnvilController';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { canvasStore, setCanvasStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { BaseHistoryAction } from '../base';

type LayerBufferSnapshot = { layerId: string; dotMag: number; webpBuffer: Uint8Array };

// history action for canvas size changes including full buffer restoration per layer
export class CanvasSizeHistoryAction extends BaseHistoryAction {
  readonly type = 'canvas_size' as const;

  // length = number of layers
  private beforeSnapshots: LayerBufferSnapshot[] | undefined;
  private afterSnapshots?: LayerBufferSnapshot[] | undefined;

  constructor(
    public readonly beforeSize: Size2D,
    public readonly afterSize: Size2D,
    context?: any
  ) {
    super(context);
  }

  createSnapshots() {
    return allLayers().map((l) => {
      const w = Math.round(canvasStore.canvas.width / l.dotMagnification);
      const h = Math.round(canvasStore.canvas.height / l.dotMagnification);
      const buf = getBufferCopy(l.id) ?? new Uint8ClampedArray(w * h * 4);
      const webp = rawToWebp(new Uint8Array(buf.buffer), w, h);
      return {
        layerId: l.id,
        dotMag: l.dotMagnification,
        webpBuffer: webp,
      };
    });
  }

  // call before resizing buffers
  registerBefore() {
    this.beforeSnapshots = this.createSnapshots();
  }

  // call after resizing buffers
  registerAfter() {
    this.afterSnapshots = this.createSnapshots();
  }

  undo(): void {
    if (!this.beforeSnapshots) {
      console.warn('CanvasSizeHistoryAction.undo: beforeSnapshots is not set');
      return;
    }
    this.applyState(this.beforeSize, this.beforeSnapshots);
  }

  redo(): void {
    if (!this.afterSnapshots) {
      console.warn('CanvasSizeHistoryAction.redo: afterSnapshots is not set');
      return;
    }
    this.applyState(this.afterSize, this.afterSnapshots);
  }

  private applyState(size: Size2D, snapshots: LayerBufferSnapshot[]) {
    this.applySize(size);
    this.restoreSnapshots(size, snapshots);
  }

  private applySize(size: Size2D) {
    setCanvasStore('canvas', size);
    adjustZoomToFit();
    eventBus.emit('canvas:sizeChanged', { newSize: size });
  }

  private restoreSnapshots(size: Size2D, snapshots: LayerBufferSnapshot[]) {
    for (const snap of snapshots) {
      const anvil = getAnvilOf(snap.layerId);
      if (!anvil) continue;
      const buffer = webpToRaw(snap.webpBuffer, size.width, size.height);
      anvil.replaceBuffer(new Uint8ClampedArray(buffer.buffer), size.width, size.height);
    }
  }
}
