import { getLayerIndex } from '~/controllers/layer/LayerListController';
import { Layer } from '~/models/layer/Layer';
import { setLayerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { BaseHistoryAction } from '../base';

export class LayerPropsHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_props' as const;

  constructor(
    public readonly layerId: string,
    public readonly oldLayerProps: Omit<Layer, 'id'>,
    public readonly newLayerProps: Omit<Layer, 'id'>,
    context?: any
  ) {
    super(context);
  }

  undo(): void {
    const idx = getLayerIndex(this.layerId);
    setLayerListStore('layers', idx, { id: this.layerId, ...this.oldLayerProps });
    eventBus.emit('webgl:requestUpdate', { context: this.context, onlyDirty: false });
  }

  redo(): void {
    const idx = getLayerIndex(this.layerId);
    setLayerListStore('layers', idx, { id: this.layerId, ...this.newLayerProps });
    eventBus.emit('webgl:requestUpdate', { context: this.context, onlyDirty: false });
  }
}
