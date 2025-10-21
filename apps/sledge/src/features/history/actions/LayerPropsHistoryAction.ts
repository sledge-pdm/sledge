import { getLayerIndex, Layer } from '~/features/layer';
import { setLayerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

export interface LayerPropsHistoryActionProps extends BaseHistoryActionProps {
  layerId: string;
  oldLayerProps: Omit<Layer, 'id'>;
  newLayerProps: Omit<Layer, 'id'>;
}

export class LayerPropsHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_props' as const;

  layerId: string;
  oldLayerProps: Omit<Layer, 'id'>;
  newLayerProps: Omit<Layer, 'id'>;

  constructor(public readonly props: LayerPropsHistoryActionProps) {
    super(props);
    this.layerId = props.layerId;
    this.oldLayerProps = props.oldLayerProps;
    this.newLayerProps = props.newLayerProps;
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

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {
        context: this.context,
        label: this.label,
        layerId: this.layerId,
        oldLayerProps: this.oldLayerProps,
        newLayerProps: this.newLayerProps,
      } as LayerPropsHistoryActionProps,
    };
  }
}
