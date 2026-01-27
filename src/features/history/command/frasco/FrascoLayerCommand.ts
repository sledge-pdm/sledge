import { HistoryContext } from '~/features/history/types';
import { getLayer } from '~/features/layer/frasco/LayerManager';
import { findLayerById } from '~/features/layer/service';
import { toolCategories } from '~/features/tools/Tools';
import { updateWebGLCanvas } from '~/webgl/service';
import { HistoryCommand } from '../HistoryCommand';

export interface FrascoLayerCommandProps {
  layerId: string;
  context?: {
    tool?: string;
  };
}

export class FrascoLayerCommand extends HistoryCommand {
  layerId: string;
  layerName: string;
  context?: {
    tool?: string;
  };

  constructor(props: FrascoLayerCommandProps) {
    super('frasco_layer');
    this.layerId = props.layerId;
    this.layerName = findLayerById(props.layerId)?.name ?? 'unknown';
    this.context = props.context;
  }

  forward(): void {
    const frascoLayer = getLayer(this.layerId);
    if (frascoLayer) frascoLayer.redo();
    updateWebGLCanvas();
  }

  backward(): void {
    const frascoLayer = getLayer(this.layerId);
    if (frascoLayer) frascoLayer.undo();
    updateWebGLCanvas();
  }

  getContext(): HistoryContext {
    return { icon: getIconForTool(this.context?.tool), description: `${this.layerName ?? 'unknown'} / ${this.context?.tool ?? 'unknown'}` };
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
