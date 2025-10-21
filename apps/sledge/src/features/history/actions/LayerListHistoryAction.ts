import { rawToWebp, webpToRaw } from '@sledge/anvil';
import type { Layer } from '~/features/layer';
import { findLayerById, removeLayer } from '~/features/layer';
import { anvilManager, getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';
import { LayerSnapshot, PackedLayerSnapshot } from './types';

export interface LayerListHistoryActionProps extends BaseHistoryActionProps {
  kind: 'add' | 'delete' | 'reorder';
  index: number;
  packedSnapshot?: PackedLayerSnapshot;
  beforeOrder?: string[];
  afterOrder?: string[];
}

export class LayerListHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_list' as const;

  kind: 'add' | 'delete' | 'reorder';
  index: number;
  packedSnapshot: PackedLayerSnapshot | undefined;
  beforeOrder?: string[];
  afterOrder?: string[];

  constructor(public readonly props: LayerListHistoryActionProps) {
    super(props);
    this.kind = props.kind;
    this.index = props.index;
    this.beforeOrder = props.beforeOrder;
    this.afterOrder = props.afterOrder;
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
      case 'reorder': {
        if (!this.beforeOrder) return;
        setOrder(this.beforeOrder);
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
      case 'reorder': {
        if (!this.afterOrder) return;
        setOrder(this.afterOrder);
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
        beforeOrder: this.beforeOrder,
        afterOrder: this.afterOrder,
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

function setOrder(order: string[]) {
  const map = new Map(layerListStore.layers.map((l) => [l.id, l] as const));
  const next: Layer[] = [];
  for (const id of order) {
    const l = map.get(id);
    if (l) next.push(l);
  }
  for (const l of layerListStore.layers) {
    if (!order.includes(l.id)) next.push(l);
  }
  setLayerListStore('layers', next);
  eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'Layer order changed' });
}

// Helper function to convert LayerSnapshot to PackedLayerSnapshot
export function packLayerSnapshot(layerSnapshot: LayerSnapshot): PackedLayerSnapshot {
  if (layerSnapshot.image) {
    const image = layerSnapshot.image;
    const webpBuffer = rawToWebp(new Uint8Array(image.buffer.buffer), image.width, image.height);
    return {
      layer: layerSnapshot.layer,
      image: {
        webpBuffer,
        width: image.width,
        height: image.height,
      },
    };
  }
  return { layer: layerSnapshot.layer };
}

export function getPackedLayerSnapshot(layerId: string): PackedLayerSnapshot | undefined {
  const layer = findLayerById(layerId);
  const anvil = getAnvilOf(layerId);
  if (!layer || !anvil) return;

  const webpBuffer = rawToWebp(new Uint8Array(anvil.getBufferData().buffer), anvil.getWidth(), anvil.getHeight());
  return {
    layer,
    image: {
      webpBuffer,
      width: anvil.getWidth(),
      height: anvil.getHeight(),
    },
  };
}
