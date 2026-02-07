import { HistoryContext, Layer } from '@sledge-pdm/core';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateFrascoCanvas } from '~/webgl/service';
import { HistoryCommand } from '../HistoryCommand';
import { registerHistoryCommand } from '../registry';

export interface LayerReorderCommandProps {
  beforeOrder: string[];
  afterOrder: string[];
}

export class LayerReorderCommand extends HistoryCommand {
  private readonly props: LayerReorderCommandProps;
  private beforeOrder: string[];
  private afterOrder: string[];

  constructor(props: LayerReorderCommandProps) {
    super('layer_reorder');
    this.props = props;
    this.beforeOrder = props.beforeOrder;
    this.afterOrder = props.afterOrder;
  }

  forward(): void {
    this.setOrder(this.afterOrder);
  }

  backward(): void {
    this.setOrder(this.beforeOrder);
  }

  private setOrder(order: string[]) {
    const map = new Map(projectStore.layers.layers.map((l) => [l.id, l] as const));
    const next: Layer[] = [];
    for (const id of order) {
      const l = map.get(id);
      if (l) next.push(l);
    }
    for (const l of projectStore.layers.layers) {
      if (!order.includes(l.id)) next.push(l);
    }
    setProjectStore('layers', 'layers', next);
    updateFrascoCanvas('Layer order changed');
  }

  getContext(): HistoryContext {
    return { icon: '/assets/icons/actions/layer.png', description: `reorder layer` };
  }

  serializeProps(): LayerReorderCommandProps {
    return { ...this.props, beforeOrder: this.beforeOrder, afterOrder: this.afterOrder };
  }
}

registerHistoryCommand('layer_reorder', (props) => new LayerReorderCommand(props as LayerReorderCommandProps));
