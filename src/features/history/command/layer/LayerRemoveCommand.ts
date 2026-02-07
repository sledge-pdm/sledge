import { HistoryContext } from '@sledge-pdm/core';
import { getPackedLayerSnapshot, inflateLayerSnapshot, PackedLayerSnapshot } from '~/features/history/snapshot';
import { findLayerById } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateFrascoCanvas } from '~/webgl/service';
import { HistoryCommand } from '../HistoryCommand';
import { registerHistoryCommand } from '../registry';

export interface LayerRemoveCommandProps {
  layerId: string;
  preserveActive?: boolean;
  index?: number | null;
  packedSnapshot?: PackedLayerSnapshot;
  layerName?: string;
}

export class LayerRemoveCommand extends HistoryCommand {
  private readonly props: LayerRemoveCommandProps;
  private layerId: string;
  private preserveActive: boolean;
  private layerName: string;
  private index: number | null = null;
  private packedSnapshot?: PackedLayerSnapshot;

  constructor(props: LayerRemoveCommandProps) {
    super('layer_remove');
    this.props = props;
    this.layerId = props.layerId;
    this.layerName = props.layerName ?? findLayerById(this.layerId)?.name ?? props.packedSnapshot?.layer.name ?? 'unknown';
    this.preserveActive = props.preserveActive ?? false;
    this.index = props.index ?? null;
    this.packedSnapshot = props.packedSnapshot;
  }

  forward(): void {
    const layers = [...projectStore.layers.layers];
    if (layers.length <= 1) return;
    const index = layers.findIndex((l) => l.id === this.layerId);
    if (index < 0) return;

    this.index = index;
    if (!this.packedSnapshot) {
      this.packedSnapshot = getPackedLayerSnapshot(this.layerId);
    }

    let newActiveIndex = 0;
    if (index !== 0) newActiveIndex = index - 1;

    layers.splice(index, 1);
    setProjectStore('layers', 'layers', layers);
    if (!this.preserveActive && layers[newActiveIndex]) {
      setProjectStore('layers', 'state', 'activeLayerId', layers[newActiveIndex].id);
    }

    layerManager.removeLayer(this.layerId);
    updateFrascoCanvas(`Layer(${this.layerId}) removed`);
  }

  backward(): void {
    if (!this.packedSnapshot || this.index === null) return;
    const inflated = inflateLayerSnapshot(this.packedSnapshot);
    if (!inflated) return;

    const arr = [...projectStore.layers.layers];
    arr.splice(this.index, 0, inflated.layer);
    setProjectStore('layers', 'layers', arr);

    const width = inflated.image?.width ?? projectStore.canvas.size.width;
    const height = inflated.image?.height ?? projectStore.canvas.size.height;
    const buffer = inflated.image?.buffer ?? new Uint8ClampedArray(width * height * 4);
    layerManager.registerLayer(inflated.layer.id, buffer, width, height, { inputSpace: 'layer' });

    updateFrascoCanvas(`Layer(${inflated.layer.id}) inserted`);
  }

  getContext(): HistoryContext {
    const name = this.layerName ?? this.packedSnapshot?.layer.name ?? 'unknown';
    return { icon: '/assets/icons/actions/layer.png', description: `remove layer / ${name}` };
  }

  serializeProps(): LayerRemoveCommandProps {
    return {
      ...this.props,
      layerId: this.layerId,
      preserveActive: this.preserveActive,
      index: this.index,
      packedSnapshot: this.packedSnapshot,
      layerName: this.layerName,
    };
  }
}

registerHistoryCommand('layer_remove', (props) => new LayerRemoveCommand(props as LayerRemoveCommandProps));
