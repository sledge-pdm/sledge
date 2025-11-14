import type { Layer } from '~/features/layer';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { updateWebGLCanvas } from '~/webgl/service';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

export interface LayerListReorderHistoryActionProps extends BaseHistoryActionProps {
  beforeOrder?: string[];
  afterOrder?: string[];
}

export class LayerListReorderHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_list_reorder' as const;

  beforeOrder?: string[];
  afterOrder?: string[];

  constructor(public readonly props: LayerListReorderHistoryActionProps) {
    super(props);
    this.beforeOrder = props.beforeOrder;
    this.afterOrder = props.afterOrder;
  }

  undo(): void {
    if (!this.beforeOrder) return;
    setOrder(this.beforeOrder);
  }

  redo(): void {
    if (!this.afterOrder) return;
    setOrder(this.afterOrder);
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {
        context: this.context,
        label: this.label,
        beforeOrder: this.beforeOrder,
        afterOrder: this.afterOrder,
      } as LayerListReorderHistoryActionProps,
    };
  }
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
  updateWebGLCanvas(false, 'Layer order changed');
}
