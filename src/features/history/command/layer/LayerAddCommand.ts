import { type RawPixelData } from '@sledge-pdm/core';
import { BlendMode } from '@sledge-pdm/frasco';
import { type PackedLayerSnapshot } from '~/features/history/actions/types';
import { getPackedLayerSnapshot, inflateLayerSnapshot } from '~/features/history/actions/utils';
import { HistoryContext } from '~/features/history/types';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { createLayer } from '~/features/layer/model';
import { NEW_LAYER_PROPS } from '~/features/layer/service';
import { LayerType, type Layer } from '~/features/layer/types';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';
import { HistoryCommand } from '../HistoryCommand';

export interface LayerAddCommandProps {
  index: number;
  layer: {
    name?: string;
    type?: LayerType;
    enabled?: boolean;
    opacity?: number;
    mode?: BlendMode;
    cutFreeze?: boolean;
  };
  initImage?: RawPixelData;
  uniqueName?: boolean;
  overrideLayerId?: string;
}

export class LayerAddCommand extends HistoryCommand {
  private index: number;
  private layerProps: LayerAddCommandProps['layer'];
  private initImage?: RawPixelData;
  private uniqueName: boolean;
  private packedSnapshot?: PackedLayerSnapshot;
  private createdLayer?: Layer;
  private overrideLayerId?: string;

  constructor(props: LayerAddCommandProps) {
    super('layer_add');
    this.index = props.index;
    this.layerProps = props.layer;
    this.initImage = props.initImage;
    this.uniqueName = props.uniqueName ?? true;
    this.overrideLayerId = props.overrideLayerId;
  }

  forward(): void {
    if (this.packedSnapshot) {
      const inserted = this.insertSnapshot(this.index, this.packedSnapshot);
      if (inserted) {
        this.createdLayer = inserted;
      }
      return;
    }

    const created = createLayer(
      {
        ...NEW_LAYER_PROPS,
        ...this.layerProps,
      },
      this.uniqueName
    );
    const newLayer: Layer = this.overrideLayerId ? { ...created, id: this.overrideLayerId } : created;

    const width = projectStore.canvas.size.width;
    const height = projectStore.canvas.size.height;
    const initialBuffer = this.initImage ?? new Uint8ClampedArray(width * height * 4);
    layerManager.registerLayer(newLayer.id, initialBuffer, width, height, { inputSpace: 'canvas' });

    const layers = [...projectStore.layers.layers];
    layers.splice(this.index, 0, newLayer as Layer);
    setProjectStore('layers', 'layers', layers);
    setProjectStore('layers', 'state', 'activeLayerId', newLayer.id);

    updateLayerPreview(newLayer.id);
    updateWebGLCanvas(`Layer(${newLayer.id}) added`);

    this.createdLayer = newLayer;
    this.packedSnapshot = getPackedLayerSnapshot(newLayer.id);
  }

  backward(): void {
    const id = this.packedSnapshot?.layer.id ?? this.createdLayer?.id;
    if (!id) return;
    this.removeLayer(id);
  }

  private insertSnapshot(index: number, packed: PackedLayerSnapshot): Layer | undefined {
    const inflated = inflateLayerSnapshot(packed);
    if (!inflated) return;

    const arr = [...projectStore.layers.layers];
    arr.splice(index, 0, inflated.layer);
    setProjectStore('layers', 'layers', arr);

    const width = inflated.image?.width ?? projectStore.canvas.size.width;
    const height = inflated.image?.height ?? projectStore.canvas.size.height;
    const buffer = inflated.image?.buffer ?? new Uint8ClampedArray(width * height * 4);
    layerManager.registerLayer(inflated.layer.id, buffer, width, height, { inputSpace: 'layer' });

    updateWebGLCanvas(`Layer(${inflated.layer.id}) inserted`);
    updateLayerPreview(inflated.layer.id);

    return inflated.layer;
  }

  private removeLayer(layerId: string) {
    const layers = [...projectStore.layers.layers];
    if (layers.length <= 1) return;
    const index = layers.findIndex((l) => l.id === layerId);
    if (index < 0) return;

    let newActiveIndex = 0;
    if (index !== 0) newActiveIndex = index - 1;
    layers.splice(index, 1);
    setProjectStore('layers', 'layers', layers);
    if (layers[newActiveIndex]) {
      setProjectStore('layers', 'state', 'activeLayerId', layers[newActiveIndex].id);
    }

    layerManager.removeLayer(layerId);
    updateWebGLCanvas(`Layer(${layerId}) removed`);
  }

  getContext(): HistoryContext {
    return { icon: '/assets/icons/actions/layer.png', description: `add layer / ${this.createdLayer?.name ?? 'unknown'}` };
  }
}
