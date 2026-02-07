import { HistoryContext } from '@sledge-pdm/core';
import { getLayer } from '~/features/layer/frasco/LayerManager';
import { findLayerById } from '~/features/layer/service';
import { toolCategories } from '~/features/tools/Tools';
import { updateFrascoCanvas } from '~/webgl/service';
import { HistoryCommand } from '../HistoryCommand';
import { registerHistoryCommand } from '../registry';

export interface FrascoLayerCommandProps {
  layerId: string;
  context?: {
    tool?: string;
  };
  layerName?: string;
}

export class FrascoLayerCommand extends HistoryCommand {
  private readonly props: FrascoLayerCommandProps;
  layerId: string;
  layerName: string;
  context?: {
    tool?: string;
  };

  constructor(props: FrascoLayerCommandProps) {
    super('frasco_layer');
    this.props = props;
    this.layerId = props.layerId;
    this.layerName = props.layerName ?? findLayerById(props.layerId)?.name ?? 'unknown';
    this.context = props.context;
  }

  forward(): void {
    const frascoLayer = getLayer(this.layerId);
    if (frascoLayer) frascoLayer.redo();
    updateFrascoCanvas();
    updateFrascoCanvas();
  }

  backward(): void {
    const frascoLayer = getLayer(this.layerId);
    if (frascoLayer) frascoLayer.undo();
    updateFrascoCanvas();
  }

  getContext(): HistoryContext {
    return { icon: getIconForTool(this.context?.tool), description: `${this.layerName ?? 'unknown'} / ${this.context?.tool ?? 'unknown'}` };
  }

  serializeProps(): FrascoLayerCommandProps {
    return { ...this.props, layerName: this.layerName, context: this.context };
  }
}

function getIconForTool(tool?: string): string {
  if (!tool) return '/assets/icons/actions/unknown.png';

  if (tool in toolCategories) {
    const categoryId = tool as keyof typeof toolCategories;
    return toolCategories[categoryId].iconSrc ?? '/assets/icons/actions/unknown.png';
  }
  switch (tool) {
    case 'clear':
      return '/assets/icons/actions/clear.png';
    case 'fx':
      return '/assets/icons/actions/fx.png';
  }

  return '/assets/icons/actions/unknown.png';
}

registerHistoryCommand('frasco_layer', (props) => new FrascoLayerCommand(props as FrascoLayerCommandProps));
