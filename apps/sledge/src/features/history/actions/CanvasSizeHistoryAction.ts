import { Size2D } from '@sledge/core';
import { adjustZoomToFit } from '~/features/canvas';
import { allLayers } from '~/features/layer';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { setCanvasStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

type LayerBufferSnapshot = { layerId: string; dotMag: number; webpBuffer: Uint8Array };

export interface CanvasSizeHistoryActionProps extends BaseHistoryActionProps {
  beforeSize: Size2D;
  afterSize: Size2D;
}

// history action for canvas size changes including full buffer restoration per layer
export class CanvasSizeHistoryAction extends BaseHistoryAction {
  readonly type = 'canvas_size' as const;

  beforeSize: Size2D;
  afterSize: Size2D;
  // length = number of layers
  private beforeSnapshots: LayerBufferSnapshot[] | undefined;
  private afterSnapshots?: LayerBufferSnapshot[] | undefined;

  constructor(public readonly props: CanvasSizeHistoryActionProps) {
    super(props);
    this.beforeSize = props.beforeSize;
    this.afterSize = props.afterSize;
  }

  createSnapshots() {
    return allLayers().map((l) => {
      const anvil = getAnvilOf(l.id);
      const webp = anvil!.exportWebp();
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
      anvil.importWebp(snap.webpBuffer, size.width, size.height);
    }
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {
        context: this.context,
        label: this.label,
        beforeSize: this.beforeSize,
        afterSize: this.afterSize,
        beforeSnapshots: this.beforeSnapshots,
        afterSnapshots: this.afterSnapshots,
      } as CanvasSizeHistoryActionProps,
    };
  }
}
