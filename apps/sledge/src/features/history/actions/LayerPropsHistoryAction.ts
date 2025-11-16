import { getLayerIndex, Layer } from '~/features/layer';
import { setLayerListStore } from '~/stores/ProjectStores';
import { updateWebGLCanvas } from '~/webgl/service';
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
    updateWebGLCanvas(false, this.context);
  }

  redo(): void {
    const idx = getLayerIndex(this.layerId);
    setLayerListStore('layers', idx, { id: this.layerId, ...this.newLayerProps });
    updateWebGLCanvas(false, this.context);
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
