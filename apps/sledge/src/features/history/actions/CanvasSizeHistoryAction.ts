import { Size2D } from '@sledge/core';
import { adjustZoomToFit } from '~/controllers/canvas/CanvasController';
import { getAgentOf, getBufferOf } from '~/controllers/layer/LayerAgentManager';
import { resetLayerImage } from '~/controllers/layer/LayerController';
import { allLayers } from '~/controllers/layer/LayerListController';
import { setCanvasStore } from '~/stores/ProjectStores';
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
    this.oldSnapshots = allLayers().map((l) => ({ layerId: l.id, dotMag: l.dotMagnification, buffer: new Uint8ClampedArray(getBufferOf(l.id)!) }));
  }

  private oldSnapshots: LayerBufferSnapshot[] = [];
  private newSnapshots?: LayerBufferSnapshot[];

  undo(): void {
    this.applyState(this.oldSize, this.oldSnapshots);
  }

  redo(): void {
    // On first redo, capture "new" snapshots after resizing once
    if (!this.newSnapshots) {
      // Resize all layers and canvas to new size first
      this.resizeAllLayers(this.newSize);
      // Capture buffers for the new size
      this.newSnapshots = allLayers().map((l) => ({ layerId: l.id, dotMag: l.dotMagnification, buffer: new Uint8ClampedArray(getBufferOf(l.id)!) }));
      // Then restore precisely from snapshots to make it deterministic
      this.restoreSnapshots(this.newSize, this.newSnapshots);
    } else {
      this.applyState(this.newSize, this.newSnapshots);
    }
  }

  private applyState(size: Size2D, snapshots: LayerBufferSnapshot[]) {
    this.resizeAllLayers(size);
    this.restoreSnapshots(size, snapshots);
  }

  private resizeAllLayers(size: Size2D) {
    const layers = allLayers();
    layers.forEach((l) => {
      const agent = getAgentOf(l.id);
      agent?.changeBufferSize(size, false);
    });
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
