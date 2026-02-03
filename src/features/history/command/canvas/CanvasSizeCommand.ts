import { gzipDeflate, Size2D } from '@sledge-pdm/core';
import { adjustZoomToFit } from '~/features/canvas';
import { inflateLayerSnapshot, PackedLayerSnapshot } from '~/features/history/snapshot';
import { CURRENT_PROJECT_VERSION } from '~/features/io/project/Project';
import { allLayers } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logSystemWarn } from '~/features/log/service';
import { selectionManagerLegacyYouShouldNotUseThis } from '~/features/selection/SelectionAreaManager';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateFrascoCanvas } from '~/webgl/service';
import { HistoryContext } from '../../types';
import { HistoryCommand } from '../HistoryCommand';
import { registerHistoryCommand } from '../registry';

type CanvasSizeHistoryMode = 'snapshot' | 'layer';

export interface CanvasSizeCommandProps {
  beforeSize: Size2D;
  afterSize: Size2D;
  beforeSnapshots?: PackedLayerSnapshot[];
  afterSnapshots?: PackedLayerSnapshot[];
  historyMode?: CanvasSizeHistoryMode;
  layerIds?: string[];
}

export class CanvasSizeCommand extends HistoryCommand {
  private readonly props: CanvasSizeCommandProps;
  private beforeSize: Size2D;
  private afterSize: Size2D;
  private historyMode: CanvasSizeHistoryMode;
  private layerIds: string[];
  private beforeSnapshots?: PackedLayerSnapshot[];
  private afterSnapshots?: PackedLayerSnapshot[];

  constructor(props: CanvasSizeCommandProps) {
    super('canvas_size');
    this.props = props;
    this.beforeSize = props.beforeSize;
    this.afterSize = props.afterSize;
    this.beforeSnapshots = props.beforeSnapshots;
    this.afterSnapshots = props.afterSnapshots;
    this.historyMode = props.historyMode ?? 'snapshot';
    this.layerIds = props.layerIds ?? allLayers().map((l) => l.id);
  }

  forward(): void {
    if (this.historyMode === 'snapshot') {
      if (!this.afterSnapshots) {
        logSystemWarn('CanvasSizeCommand.forward: afterSnapshots is not set', { label: 'CanvasSizeCommand' });
        return;
      }
      this.applyState(this.afterSize, this.afterSnapshots);
      return;
    }
    this.applySize(this.afterSize);
    this.applyLayerHistory('redo');
  }

  backward(): void {
    if (this.historyMode === 'snapshot') {
      if (!this.beforeSnapshots) {
        logSystemWarn('CanvasSizeCommand.backward: beforeSnapshots is not set', { label: 'CanvasSizeCommand' });
        return;
      }
      this.applyState(this.beforeSize, this.beforeSnapshots);
      return;
    }
    this.applySize(this.beforeSize);
    this.applyLayerHistory('undo');
  }

  getContext(): HistoryContext {
    const beforeArea = this.beforeSize.width * this.beforeSize.height;
    const afterArea = this.afterSize.width * this.afterSize.height;
    const bigger = afterArea >= beforeArea;
    const icon = bigger ? '/assets/icons/actions/canvas_size_bigger.png' : '/assets/icons/actions/canvas_size_smaller.png';
    const description = `${this.beforeSize.width}x${this.beforeSize.height} -> ${this.afterSize.width}x${this.afterSize.height}`;
    return { icon, description };
  }

  serializeProps(): CanvasSizeCommandProps {
    return {
      ...this.props,
      beforeSnapshots: this.beforeSnapshots,
      afterSnapshots: this.afterSnapshots,
      historyMode: this.historyMode,
      layerIds: this.layerIds,
    };
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

  registerBefore() {
    if (this.historyMode === 'snapshot') {
      this.beforeSnapshots = this.createSnapshots();
    }
  }

  registerAfter() {
    if (this.historyMode === 'snapshot') {
      this.afterSnapshots = this.createSnapshots();
    }
  }

  private applyState(size: Size2D, snapshots: PackedLayerSnapshot[]) {
    this.applySize(size);
    this.restoreSnapshots(snapshots);
  }

  private applySize(size: Size2D) {
    setProjectStore('canvas', 'size', size);
    adjustZoomToFit();
    selectionManagerLegacyYouShouldNotUseThis.resizeSelectionMask(size);
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
    updateFrascoCanvas(`canvas resize restore`);
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
        updated = true;
      } catch {
        // ignore layer failures to keep canvas size state consistent
      }
    }
    if (updated) {
      updateFrascoCanvas(`canvas resize ${mode}`);
    }
  }
}

registerHistoryCommand('canvas_size', (props) => new CanvasSizeCommand(props as CanvasSizeCommandProps));
