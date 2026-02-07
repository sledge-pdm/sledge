import { HistoryContext } from '@sledge-pdm/core';
import { HistoryCommand } from '~/features/history/command/HistoryCommand';
import { findLayerById } from '~/features/layer';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { registerHistoryCommand } from '../registry';

export interface SetActiveLayerCommandProps {
  layerId: string;
  pastActiveLayerId?: string;
}

export class SetActiveLayerCommand extends HistoryCommand {
  private readonly props: SetActiveLayerCommandProps;
  private pastActiveLayerId: string | undefined;
  private layerId: string;

  constructor(props: SetActiveLayerCommandProps) {
    super('set_active_layer');
    this.props = props;
    this.layerId = props.layerId;
    this.pastActiveLayerId = props.pastActiveLayerId;
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

  serializeProps(): SetActiveLayerCommandProps {
    return { ...this.props, layerId: this.layerId, pastActiveLayerId: this.pastActiveLayerId };
  }
}

registerHistoryCommand('set_active_layer', (props) => new SetActiveLayerCommand(props as SetActiveLayerCommandProps));
