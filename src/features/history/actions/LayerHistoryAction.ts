import { getLayer } from '~/features/layer/frasco/LayerManager';
import { updateFrascoCanvas } from '~/webgl/service';
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
    updateFrascoCanvas(`Layer(${this.layerId}) undo`);
  }

  redo(): void {
    try {
      getLayer(this.layerId).redo();
    } catch {
      return;
    }
    updateFrascoCanvas(`Layer(${this.layerId}) redo`);
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: this.props,
    };
  }
}
