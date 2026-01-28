import { gzipDeflate } from '@sledge-pdm/core';
import { SurfaceBounds } from '@sledge-pdm/frasco';
import { getLayerIndex } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateFrascoCanvas } from '~/webgl/service';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';
import { LayerSnapshot, PackedLayerSnapshot } from './types';
import { inflateLayerSnapshot } from './utils';

export interface LayerMergeHistoryActionProps extends BaseHistoryActionProps {
  originIndex: number;
  targetIndex: number;
  activeLayerId: string;
  originPackedSnapshot?: PackedLayerSnapshot;
  targetPackedSnapshot?: PackedLayerSnapshot;
}

export class LayerMergeHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_merge' as const;

  originIndex: number;
  targetIndex: number;
  activeLayerId: string;
  originPackedSnapshot: PackedLayerSnapshot | undefined;
  targetPackedSnapshot: PackedLayerSnapshot | undefined;

  constructor(public readonly props: LayerMergeHistoryActionProps) {
    super(props);
    this.originIndex = props.originIndex;
    this.targetIndex = props.targetIndex;
    this.activeLayerId = props.activeLayerId;
    this.originPackedSnapshot = props.originPackedSnapshot ?? this.getSnapshot(this.originIndex);
    this.targetPackedSnapshot = props.targetPackedSnapshot ?? this.getSnapshot(this.targetIndex);
  }

  getSnapshot(index: number): PackedLayerSnapshot | undefined {
    const layer = projectStore.layers.layers[index];
    if (!layer) return;
    const frascoLayer = layerManager.getLayerOptional(layer.id);
    if (!frascoLayer) return;
    const buffer = frascoLayer.readPixels();
    return {
      layer: { ...layer },
      image: { packedBuffer: gzipDeflate(buffer), width: frascoLayer.getWidth(), height: frascoLayer.getHeight() },
    };
  }

  applySnapshot(snapshot?: LayerSnapshot) {
    if (!snapshot) return;

    const idx = getLayerIndex(snapshot.layer.id);
    if (idx >= 0) {
      setProjectStore('layers', 'layers', idx, snapshot.layer);

      if (snapshot.image) {
        const frascoLayer = layerManager.getLayerOptional(snapshot.layer.id);
        if (frascoLayer) {
          const bounds: SurfaceBounds = { x: 0, y: 0, width: snapshot.image.width, height: snapshot.image.height };
          frascoLayer.writePixels(snapshot.image.buffer, { bounds });
        }
      }
    }
  }

  swapSnapshots() {
    if (!this.originPackedSnapshot || !this.targetPackedSnapshot) {
      throw new Error(
        `Layer merge snapshots are missing. Cannot perform undo/redo operation. ` +
          `originPackedSnapshot: ${this.originPackedSnapshot ? 'present' : 'missing'}, ` +
          `targetPackedSnapshot: ${this.targetPackedSnapshot ? 'present' : 'missing'}.`
      );
    }
    const swapOriginPackedSnapshot = this.getSnapshot(this.originIndex);
    const swapTargetPackedSnapshot = this.getSnapshot(this.targetIndex);
    const swapActiveLayerId = projectStore.layers.state.activeLayerId;

    setProjectStore('layers', 'state', 'activeLayerId', this.activeLayerId);

    // apply snapshot
    this.applySnapshot(inflateLayerSnapshot(this.originPackedSnapshot));
    this.applySnapshot(inflateLayerSnapshot(this.targetPackedSnapshot));

    updateFrascoCanvas('Layer merge undo/redo');

    // swap
    this.originPackedSnapshot = swapOriginPackedSnapshot;
    this.targetPackedSnapshot = swapTargetPackedSnapshot;
    this.activeLayerId = swapActiveLayerId;
  }

  undo(): void {
    this.swapSnapshots();
  }

  redo(): void {
    this.swapSnapshots();
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {
        context: this.context,
        label: this.label,
        originIndex: this.originIndex,
        targetIndex: this.targetIndex,
        activeLayerId: this.activeLayerId,
        originPackedSnapshot: this.originPackedSnapshot,
        targetPackedSnapshot: this.targetPackedSnapshot,
      } as LayerMergeHistoryActionProps,
    };
  }
}
