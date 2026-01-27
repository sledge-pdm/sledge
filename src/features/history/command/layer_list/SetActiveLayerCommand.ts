import { HistoryCommand } from '~/features/history/command/HistoryCommand';
import { HistoryContext } from '~/features/history/types';
import { findLayerById } from '~/features/layer';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';

export interface SetActiveLayerCommandProps {
  layerId: string;
}

export class SetActiveLayerCommand extends HistoryCommand {
  private pastActiveLayerId: string | undefined;
  private layerId: string;

  constructor(props: SetActiveLayerCommandProps) {
    super('set_active_layer');
    this.layerId = props.layerId;
  }
  forward(): void {
    this.pastActiveLayerId = projectStore.layers.state.activeLayerId;
    setProjectStore('layers', 'state', 'activeLayerId', this.layerId);
  }

  backward(): void {
    if (!this.pastActiveLayerId) return;
    setProjectStore('layers', 'state', 'activeLayerId', this.pastActiveLayerId);
  }

  getContext(): HistoryContext {
    const layerName = findLayerById(this.layerId)?.name ?? 'unknown layer';
    // usually not used as individual context
    return { icon: '/assets/icons/actions/layer.png', description: `change active layer / ${layerName}` };
  }
}
