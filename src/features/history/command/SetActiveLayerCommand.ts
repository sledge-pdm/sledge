import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { CommandContext, HistoryCommand } from './HistoryCommand';

export interface SetActiveLayerCommandProps {
  layerId: string;
}

interface SetActiveLayerCommandContext extends CommandContext {
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

  getContext(): SetActiveLayerCommandContext {
    return { layerId: this.layerId };
  }
}
