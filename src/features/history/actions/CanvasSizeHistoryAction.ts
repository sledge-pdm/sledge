import { gzipDeflate, Size2D } from '@sledge-pdm/core';
import { adjustZoomToFit } from '~/features/canvas';
import { CURRENT_PROJECT_VERSION } from '~/features/io/project/Project';
import { allLayers } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logSystemWarn } from '~/features/log/service';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import { eventBus } from '~/utils/EventBus';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';
import { PackedLayerSnapshot } from './types';
import { inflateLayerSnapshot } from './utils';

type CanvasSizeHistoryMode = 'snapshot' | 'layer';

export interface CanvasSizeHistoryActionProps extends BaseHistoryActionProps {
  beforeSize: Size2D;
  afterSize: Size2D;
  beforeSnapshots?: PackedLayerSnapshot[];
  afterSnapshots?: PackedLayerSnapshot[];
  historyMode?: CanvasSizeHistoryMode;
  layerIds?: string[];
}

// history action for canvas size changes including full buffer restoration per layer
export class CanvasSizeHistoryAction extends BaseHistoryAction {
  readonly type = 'canvas_size' as const;

  beforeSize: Size2D;
  afterSize: Size2D;
  historyMode: CanvasSizeHistoryMode;
  layerIds: string[];
  // length = number of layers
  private beforeSnapshots: PackedLayerSnapshot[] | undefined;
  private afterSnapshots?: PackedLayerSnapshot[] | undefined;

  constructor(public readonly props: CanvasSizeHistoryActionProps) {
    super(props);

    this.beforeSize = props.beforeSize;
    this.afterSize = props.afterSize;

    this.beforeSnapshots = props.beforeSnapshots;
    this.afterSnapshots = props.afterSnapshots;
    this.historyMode = props.historyMode ?? 'snapshot';
    this.layerIds = props.layerIds ?? allLayers().map((l) => l.id);
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
    if (this.historyMode === 'snapshot') {
      this.beforeSnapshots = this.createSnapshots();
    }
  }

  // call after resizing buffers
  registerAfter() {
    if (this.historyMode === 'snapshot') {
      this.afterSnapshots = this.createSnapshots();
    }
  }

  undo(): void {
    if (this.historyMode === 'snapshot') {
      if (!this.beforeSnapshots) {
        logSystemWarn('CanvasSizeHistoryAction.undo: beforeSnapshots is not set', { label: 'CanvasSizeHistoryAction' });
        return;
      }
      this.applyState(this.beforeSize, this.beforeSnapshots);
      return;
    }
    this.applySize(this.beforeSize);
    this.applyLayerHistory('undo');
  }

  redo(): void {
    if (this.historyMode === 'snapshot') {
      if (!this.afterSnapshots) {
        logSystemWarn('CanvasSizeHistoryAction.redo: afterSnapshots is not set', { label: 'CanvasSizeHistoryAction' });
        return;
      }
      this.applyState(this.afterSize, this.afterSnapshots);
      return;
    }
    this.applySize(this.afterSize);
    this.applyLayerHistory('redo');
  }

  private applyState(size: Size2D, snapshots: PackedLayerSnapshot[]) {
    this.applySize(size);
    this.restoreSnapshots(snapshots);
  }

  private applySize(size: Size2D) {
    setProjectStore('canvas', 'size', size);
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

  private applyLayerHistory(mode: 'undo' | 'redo') {
    let updated = false;
    for (const layerId of this.layerIds) {
      const layer = layerManager.getLayerOptional(layerId);
      if (!layer) continue;
      try {
        if (mode === 'undo') {
          layer.undo();
        } else {
          layer.redo();
        }
        updateLayerPreview(layerId);
        updated = true;
      } catch {
        // ignore layer failures to keep canvas size state consistent
      }
    }
    if (updated) {
      updateWebGLCanvas(`canvas resize ${mode}`);
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
        historyMode: this.historyMode,
        layerIds: this.layerIds,
      } as CanvasSizeHistoryActionProps,
    };
  }
}
