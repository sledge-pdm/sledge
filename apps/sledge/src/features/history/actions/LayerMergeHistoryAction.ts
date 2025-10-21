import { rawToWebp, webpToRaw } from '@sledge/anvil';
import { getLayerIndex } from '~/features/layer';
import { anvilManager, getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
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
    const anvil = getAnvilOf(layer.id);
    if (!anvil) return;

    const webpBuffer = rawToWebp(new Uint8Array(anvil.getBufferPointer().buffer), anvil.getWidth(), anvil.getHeight());
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
        const anvil = getAnvilOf(snapshot.layer.id);
        const rawBuffer = new Uint8ClampedArray(webpToRaw(snapshot.image.webpBuffer, snapshot.image.width, snapshot.image.height).buffer);
        if (anvil) anvil.replaceBuffer(rawBuffer);
        else anvilManager.registerAnvil(snapshot.layer.id, rawBuffer, snapshot.image.width, snapshot.image.height);
      }

      eventBus.emit('preview:requestUpdate', { layerId: snapshot.layer.id });
    }

    eventBus.emit('preview:requestUpdate', { layerId: snapshot.layer.id });
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

    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'Layer merge undo/redo' });

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
