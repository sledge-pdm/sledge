import { getLayerIndex } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';
import { LayerSnapshot } from './types';

export interface LayerMergeHistoryActionProps extends BaseHistoryActionProps {
  originIndex: number;
  targetIndex: number;
  activeLayerId: string;
  originPackedSnapshot?: LayerSnapshot;
  targetPackedSnapshot?: LayerSnapshot;
}

export class LayerMergeHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_merge' as const;

  originIndex: number;
  targetIndex: number;
  activeLayerId: string;
  originPackedSnapshot: LayerSnapshot | undefined;
  targetPackedSnapshot: LayerSnapshot | undefined;

  constructor(public readonly props: LayerMergeHistoryActionProps) {
    super(props);
    this.originIndex = props.originIndex;
    this.targetIndex = props.targetIndex;
    this.activeLayerId = props.activeLayerId;
    this.originPackedSnapshot = props.originPackedSnapshot ?? this.getSnapshot(this.originIndex);
    this.targetPackedSnapshot = props.targetPackedSnapshot ?? this.getSnapshot(this.targetIndex);
  }

  getSnapshot(index: number): LayerSnapshot | undefined {
    const layer = layerListStore.layers[index];
    if (!layer) return;
    const frascoLayer = layerManager.getLayerOptional(layer.id);
    if (!frascoLayer) return;
    const buffer = frascoLayer.exportRaw();
    return {
      layer: { ...layer },
      image: {
        buffer: new Uint8ClampedArray(buffer),
        width: frascoLayer.getWidth(),
        height: frascoLayer.getHeight(),
      },
    };
  }

  applySnapshot(snapshot: LayerSnapshot) {
    const idx = getLayerIndex(snapshot.layer.id);
    if (idx >= 0) {
      setLayerListStore('layers', idx, snapshot.layer);

      if (snapshot.image) {
        const frascoLayer = layerManager.getLayerOptional(snapshot.layer.id);
        if (frascoLayer) {
          frascoLayer.replaceBuffer(snapshot.image.buffer, snapshot.image.width, snapshot.image.height);
        }
      }
    }
    updateLayerPreview(snapshot.layer.id);
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
    const swapActiveLayerId = layerListStore.activeLayerId;

    setLayerListStore('activeLayerId', this.activeLayerId);

    // apply snapshot
    this.applySnapshot(this.originPackedSnapshot);
    this.applySnapshot(this.targetPackedSnapshot);

    updateWebGLCanvas(false, 'Layer merge undo/redo');

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
