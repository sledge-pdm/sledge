import { HistoryContext } from '~/features/history/types';
import type { Layer } from '~/features/layer';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateWebGLCanvas } from '~/webgl/service';
import { HistoryCommand } from '../HistoryCommand';

export interface LayerReorderCommandProps {
  beforeOrder: string[];
  afterOrder: string[];
}

export class LayerReorderCommand extends HistoryCommand {
  private beforeOrder: string[];
  private afterOrder: string[];

  constructor(props: LayerReorderCommandProps) {
    super('layer_reorder');
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
    updateWebGLCanvas('Layer order changed');
  }

  getContext(): HistoryContext {
    return { icon: '/assets/icons/actions/layer.png', description: `reorder layer` };
  }
}
