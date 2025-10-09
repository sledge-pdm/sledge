import { rawToWebp, webpToRaw } from '@sledge/anvil';
import type { Layer } from '~/features/layer';
import { removeLayer } from '~/features/layer';
import { anvilManager, getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { BaseHistoryAction } from '../base';

export interface LayerSnapshot {
  layer: Layer;
  image?: {
    buffer: Uint8ClampedArray;
    width: number;
    height: number;
  };
}
export interface PackedLayerSnapshot {
  layer: Layer;
  image?: {
    webpBuffer: Uint8Array;
    width: number;
    height: number;
  };
}

export class LayerListHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_list' as const;
  readonly packedSnapshot: PackedLayerSnapshot | undefined;

  constructor(
    public readonly kind: 'add' | 'delete' | 'reorder',
    public readonly index: number,
    layerSnapshot?: LayerSnapshot,
    public readonly beforeOrder?: string[],
    public readonly afterOrder?: string[],
    context?: any
  ) {
    super(context);

    if (layerSnapshot?.image) {
      const image = layerSnapshot.image;
      const webpBuffer = rawToWebp(new Uint8Array(image.buffer.buffer), image.width, image.height);
      this.packedSnapshot = {
        layer: layerSnapshot.layer,
        image: {
          webpBuffer,
          width: image.width,
          height: image.height,
        },
      };
    }
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
