import { type PackedLayerSnapshot } from '~/features/history/actions/types';
import { getPackedLayerSnapshot, inflateLayerSnapshot } from '~/features/history/actions/utils';
import { HistoryContext } from '~/features/history/types';
import { findLayerById } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';
import { HistoryCommand } from '../HistoryCommand';

export interface LayerRemoveCommandProps {
  layerId: string;
  preserveActive?: boolean;
}

export class LayerRemoveCommand extends HistoryCommand {
  private layerId: string;
  private preserveActive: boolean;
  private layerName: string;
  private index: number | null = null;
  private packedSnapshot?: PackedLayerSnapshot;

  constructor(props: LayerRemoveCommandProps) {
    super('layer_remove');
    this.layerId = props.layerId;
    this.layerName = findLayerById(this.layerId)?.name ?? 'unknown';
    this.preserveActive = props.preserveActive ?? false;
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
    updateWebGLCanvas(`Layer(${this.layerId}) removed`);
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

    updateWebGLCanvas(`Layer(${inflated.layer.id}) inserted`);
    updateLayerPreview(inflated.layer.id);
  }

  getContext(): HistoryContext {
    return { icon: '/assets/icons/actions/layer.png', description: `remove layer / ${this.layerName ?? 'unknown'}` };
  }
}
