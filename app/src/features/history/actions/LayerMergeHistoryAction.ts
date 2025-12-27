import { webpToRaw } from '@sledge/anvil';
import { getLayerIndex } from '~/features/layer';
import { anvilManager, getAnvil } from '~/features/layer/anvil/AnvilManager';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';
import { PackedLayerSnapshot } from './types';

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
    const layer = layerListStore.layers[index];
    if (!layer) return;
    const anvil = getAnvil(layer.id);

    const webpBuffer = anvil.exportWebp();
    return {
      layer: { ...layer },
      image: {
        webpBuffer,
        width: anvil.getWidth(),
        height: anvil.getHeight(),
      },
    };
  }

  applySnapshot(snapshot: PackedLayerSnapshot) {
    const idx = getLayerIndex(snapshot.layer.id);
    if (idx >= 0) {
      setLayerListStore('layers', idx, snapshot.layer);

      if (snapshot.image) {
        try {
          const anvil = getAnvil(snapshot.layer.id);
          anvil.importWebp(snapshot.image.webpBuffer, snapshot.image.width, snapshot.image.height);
        } catch {
          const rawBuffer = webpToRaw(snapshot.image.webpBuffer, snapshot.image.width, snapshot.image.height);
          anvilManager.registerAnvil(snapshot.layer.id, rawBuffer, snapshot.image.width, snapshot.image.height);
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
