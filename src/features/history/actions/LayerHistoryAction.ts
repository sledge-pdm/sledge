import { getLayer } from '~/features/layer/frasco/LayerManager';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

export interface LayerHistoryActionProps extends BaseHistoryActionProps {
  layerId: string;
}

export class LayerHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_buffer';
  layerId: string;

  constructor(public readonly props: LayerHistoryActionProps) {
    super(props);
    this.layerId = props.layerId;
  }

  undo(): void {
    try {
      getLayer(this.layerId).undo();
    } catch {
      return;
    }
    updateWebGLCanvas(`Layer(${this.layerId}) undo`);
    updateLayerPreview(this.layerId);
  }

  redo(): void {
    try {
      getLayer(this.layerId).redo();
    } catch {
      return;
    }
    updateWebGLCanvas(`Layer(${this.layerId}) redo`);
    updateLayerPreview(this.layerId);
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: this.props,
    };
  }
}
