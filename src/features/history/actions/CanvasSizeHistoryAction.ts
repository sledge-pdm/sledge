import { gzipDeflate, Size2D } from '@sledge-pdm/core';
import { adjustZoomToFit } from '~/features/canvas';
import { CURRENT_PROJECT_VERSION } from '~/features/io/types/Project';
import { allLayers } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logSystemWarn } from '~/features/log/service';
import { setCanvasStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { updateWebGLCanvas } from '~/webgl/service';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';
import { PackedLayerSnapshot } from './types';
import { inflateLayerSnapshot } from './utils';

export interface CanvasSizeHistoryActionProps extends BaseHistoryActionProps {
  beforeSize: Size2D;
  afterSize: Size2D;
  beforeSnapshots?: PackedLayerSnapshot[];
  afterSnapshots?: PackedLayerSnapshot[];
}

// history action for canvas size changes including full buffer restoration per layer
export class CanvasSizeHistoryAction extends BaseHistoryAction {
  readonly type = 'canvas_size' as const;

  beforeSize: Size2D;
  afterSize: Size2D;
  // length = number of layers
  private beforeSnapshots: PackedLayerSnapshot[] | undefined;
  private afterSnapshots?: PackedLayerSnapshot[] | undefined;

  constructor(public readonly props: CanvasSizeHistoryActionProps) {
    super(props);

    this.beforeSize = props.beforeSize;
    this.afterSize = props.afterSize;

    this.beforeSnapshots = props.beforeSnapshots;
    this.afterSnapshots = props.afterSnapshots;
  }

  createSnapshots(): PackedLayerSnapshot[] {
    return allLayers().map((l) => {
      const frascoLayer = layerManager.getLayerOptional(l.id);
      if (!frascoLayer) {
        return {
          version: CURRENT_PROJECT_VERSION,
          layer: { ...l },
          image: {
            codec: 'deflate',
            packedBuffer: new Uint8Array(0),
            width: 0,
            height: 0,
          },
        };
      }
      const width = frascoLayer.getWidth();
      const height = frascoLayer.getHeight();
      const packedBuffer = gzipDeflate(frascoLayer.readPixels());
      return {
        version: CURRENT_PROJECT_VERSION,
        layer: { ...l },
        image: {
          codec: 'deflate',
          packedBuffer,
          width,
          height,
        },
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
      logSystemWarn('CanvasSizeHistoryAction.undo: beforeSnapshots is not set', { label: 'CanvasSizeHistoryAction' });
      return;
    }
    this.applyState(this.beforeSize, this.beforeSnapshots);
  }

  redo(): void {
    if (!this.afterSnapshots) {
      logSystemWarn('CanvasSizeHistoryAction.redo: afterSnapshots is not set', { label: 'CanvasSizeHistoryAction' });
      return;
    }
    this.applyState(this.afterSize, this.afterSnapshots);
  }

  private applyState(size: Size2D, snapshots: PackedLayerSnapshot[]) {
    this.applySize(size);
    this.restoreSnapshots(snapshots);
  }

  private applySize(size: Size2D) {
    setCanvasStore('size', size);
    adjustZoomToFit();
    eventBus.emit('canvas:sizeChanged', { newSize: size });
  }

  private restoreSnapshots(snapshots: PackedLayerSnapshot[]) {
    for (const snap of snapshots) {
      const inflated = inflateLayerSnapshot(snap);
      if (inflated === undefined || inflated.image === undefined) continue;
      const { buffer, width, height } = inflated.image;
      const frascoLayer = layerManager.getLayerOptional(snap.layer.id);
      if (frascoLayer) {
        frascoLayer.writePixels(buffer, {
          bounds: { x: 0, y: 0, width, height },
        });
      } else {
        layerManager.registerLayer(snap.layer.id, buffer, width, height, { inputSpace: 'layer' });
      }
    }
    updateWebGLCanvas(`canvas resize restore`);
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
