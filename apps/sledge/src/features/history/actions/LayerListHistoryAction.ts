import type { Layer } from '~/features/layer';
import { removeLayer } from '~/features/layer';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { BaseHistoryAction } from '../base';

export class LayerListHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_list' as const;

  constructor(
    public readonly kind: 'add' | 'delete' | 'reorder',
    public readonly index: number,
    public readonly layerSnapshot?: Layer & { buffer?: Uint8ClampedArray },
    public readonly beforeOrder?: string[],
    public readonly afterOrder?: string[],
    context?: any
  ) {
    super(context);
  }

  undo(): void {
    switch (this.kind) {
      case 'add': {
        const id = this.layerSnapshot?.id;
        if (!id) return;
        removeLayer(id, { noDiff: true });
        break;
      }
      case 'delete': {
        if (!this.layerSnapshot) return;
        insertAt(this.index, this.layerSnapshot);
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
        if (!this.layerSnapshot) return;
        insertAt(this.index, this.layerSnapshot);
        break;
      }
      case 'delete': {
        const id = this.layerSnapshot?.id ?? layerListStore.layers[this.index]?.id;
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

function insertAt(index: number, layer: Layer & { buffer?: Uint8ClampedArray }) {
  const { buffer, ...layerProps } = layer as any;
  const arr = [...layerListStore.layers];
  arr.splice(index, 0, layerProps as Layer);
  setLayerListStore('layers', arr);
  if (buffer) getAnvilOf(layer.id)?.replaceBuffer(buffer);
  eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: `Layer(${layer.id}) inserted` });
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
