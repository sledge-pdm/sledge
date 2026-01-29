import { HistoryContext } from '~/features/history/types';
import { findLayerById } from '~/features/layer';
import { type Layer } from '~/features/layer/types';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateFrascoCanvas } from '~/webgl/service';
import { HistoryCommand } from '../HistoryCommand';
import { registerHistoryCommand } from '../registry';

export interface LayerPropsCommandProps {
  layerId: string;
  oldLayerProps?: Omit<Layer, 'id'>;
  newLayerProps?: Omit<Layer, 'id'>;
}

const propNamesToUpdate: Exclude<keyof Layer, 'id'>[] = ['mode', 'opacity', 'enabled', 'type'];

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

export class LayerPropsCommand extends HistoryCommand {
  private readonly props: LayerPropsCommandProps;
  private layerId: string;
  private oldLayerProps?: Omit<Layer, 'id'>;
  private newLayerProps?: Omit<Layer, 'id'>;

  constructor(props: LayerPropsCommandProps) {
    super('layer_props');
    this.props = props;
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

  forward(): void {
    if (!this.newLayerProps) return;
    this.applyProps(this.newLayerProps);
  }

  backward(): void {
    if (!this.oldLayerProps) return;
    this.applyProps(this.oldLayerProps);
  }

  private applyProps(props: Omit<Layer, 'id'>) {
    const idx = this.getLayerIndex();
    if (idx < 0) return;
    setProjectStore('layers', 'layers', idx, { id: this.layerId, ...props });
    if (this.shouldUpdate()) {
      updateFrascoCanvas('Layer props changed');
    }
  }

  private shouldUpdate(): boolean {
    if (!this.oldLayerProps || !this.newLayerProps) return true;
    return propNamesToUpdate.some((key) => this.oldLayerProps?.[key] !== this.newLayerProps?.[key]);
  }

  private getLayerIndex(): number {
    return projectStore.layers.layers.findIndex((l) => l.id === this.layerId);
  }

  getContext(): HistoryContext {
    const layerName = findLayerById(this.layerId)?.name ?? 'unknown layer';
    // more detailed props change
    return { icon: '/assets/icons/actions/layer.png', description: `${layerName} / props change` };
  }

  serializeProps(): LayerPropsCommandProps {
    return {
      ...this.props,
      layerId: this.layerId,
      oldLayerProps: this.oldLayerProps,
      newLayerProps: this.newLayerProps,
    };
  }
}

registerHistoryCommand('layer_props', (props) => new LayerPropsCommand(props as LayerPropsCommandProps));
