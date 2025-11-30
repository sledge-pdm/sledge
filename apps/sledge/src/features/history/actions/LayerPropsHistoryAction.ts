import { findLayerById, getLayerIndex, Layer } from '~/features/layer';
import { setLayerListStore } from '~/stores/ProjectStores';
import { updateWebGLCanvas } from '~/webgl/service';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

export interface LayerPropsHistoryActionProps extends BaseHistoryActionProps {
  layerId: string;
  oldLayerProps?: Omit<Layer, 'id'>;
  newLayerProps?: Omit<Layer, 'id'>;
}

function stripId(layer: Layer): Omit<Layer, 'id'> {
  const { id: _id, ...rest } = layer;
  return rest;
}

function shallowEqual(a?: Omit<Layer, 'id'>, b?: Omit<Layer, 'id'>): boolean {
  if (!a || !b) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    // @ts-expect-error index signature not needed
    if (a[key] !== b[key]) return false;
  }
  return true;
}

export class LayerPropsHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_props' as const;

  layerId: string;
  oldLayerProps?: Omit<Layer, 'id'>;
  newLayerProps?: Omit<Layer, 'id'>;

  constructor(public readonly props: LayerPropsHistoryActionProps) {
    super(props);
    this.layerId = props.layerId;
    this.oldLayerProps = props.oldLayerProps;
    this.newLayerProps = props.newLayerProps;
  }

  registerBefore(layer?: Layer) {
    const target = layer ?? findLayerById(this.layerId);
    if (target) {
      this.oldLayerProps = stripId(target);
    }
  }

  registerAfter(layer?: Layer) {
    const target = layer ?? findLayerById(this.layerId);
    if (target) {
      this.newLayerProps = stripId(target);
    }
  }

  hasDiff(): boolean {
    if (!this.oldLayerProps || !this.newLayerProps) return true;
    return !shallowEqual(this.oldLayerProps, this.newLayerProps);
  }

  undo(): void {
    if (!this.oldLayerProps) return;
    const idx = getLayerIndex(this.layerId);
    setLayerListStore('layers', idx, { id: this.layerId, ...this.oldLayerProps });
    updateWebGLCanvas(false, this.context);
  }

  redo(): void {
    if (!this.newLayerProps) return;
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
