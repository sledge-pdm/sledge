import { webpToRaw } from '@sledge/anvil';
import { removeLayer } from '~/features/layer';
import { anvilManager, getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';
import { PackedLayerSnapshot } from './types';

export interface LayerListHistoryActionProps extends BaseHistoryActionProps {
  kind: 'add' | 'delete';
  index: number;
  packedSnapshot?: PackedLayerSnapshot;
  beforeOrder?: string[];
  afterOrder?: string[];
}

export class LayerListHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_list' as const;

  kind: 'add' | 'delete';
  index: number;
  packedSnapshot: PackedLayerSnapshot | undefined;
  beforeOrder?: string[];
  afterOrder?: string[];

  constructor(public readonly props: LayerListHistoryActionProps) {
    super(props);
    this.kind = props.kind;
    this.index = props.index;
    this.packedSnapshot = props.packedSnapshot;
  }

  undo(): void {
    switch (this.kind) {
      case 'add': {
        const id = this.packedSnapshot?.layer.id;
        if (!id) return;
        removeLayer(id, { noDiff: true });
        break;
      }
      case 'delete': {
        if (!this.packedSnapshot) return;
        insertAt(this.index, this.packedSnapshot);
        break;
      }
    }
  }

  redo(): void {
    switch (this.kind) {
      case 'add': {
        if (!this.packedSnapshot) return;
        insertAt(this.index, this.packedSnapshot);
        break;
      }
      case 'delete': {
        const id = this.packedSnapshot?.layer.id ?? layerListStore.layers[this.index]?.id;
        if (!id) return;
        removeLayer(id, { noDiff: true });
        break;
      }
    }
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {
        context: this.context,
        label: this.label,
        kind: this.kind,
        index: this.index,
        packedSnapshot: this.packedSnapshot,
      } as LayerListHistoryActionProps,
    };
  }
}

function insertAt(index: number, snapshot: PackedLayerSnapshot) {
  const arr = [...layerListStore.layers];
  arr.splice(index, 0, snapshot.layer);
  setLayerListStore('layers', arr);
  if (snapshot.image) {
    const anvil = getAnvilOf(snapshot.layer.id);
    const rawBuffer = new Uint8ClampedArray(webpToRaw(snapshot.image.webpBuffer, snapshot.image.width, snapshot.image.height).buffer);
    if (anvil) anvil.replaceBuffer(rawBuffer);
    else anvilManager.registerAnvil(snapshot.layer.id, rawBuffer, snapshot.image.width, snapshot.image.height);
  }
  eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: `Layer(${snapshot.layer.id}) inserted` });
  eventBus.emit('preview:requestUpdate', { layerId: snapshot.layer.id });
}
