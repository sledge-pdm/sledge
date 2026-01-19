import { removeLayer } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';
import { LayerSnapshot, PackedLayerSnapshot } from './types';
import { inflateLayerSnapshot } from './utils';

export interface LayerListHistoryActionProps extends BaseHistoryActionProps {
  kind: 'add' | 'delete';
  index: number;
  packedSnapshot?: PackedLayerSnapshot;
  beforeOrder?: string[];
  afterOrder?: string[];
}

export class LayerListHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_list' as const;

  kind: 'add' | 'delete';
  index: number;
  packedSnapshot: PackedLayerSnapshot | undefined;
  beforeOrder?: string[];
  afterOrder?: string[];

  constructor(public readonly props: LayerListHistoryActionProps) {
    super(props);
    this.kind = props.kind;
    this.index = props.index;
    this.packedSnapshot = props.packedSnapshot;
  }

  undo(): void {
    switch (this.kind) {
      case 'add': {
        const id = this.packedSnapshot?.layer.id;
        if (!id) return;
        removeLayer(id, { noDiff: true });
        break;
      }
      case 'delete': {
        if (!this.packedSnapshot) return;
        const inflated = inflateLayerSnapshot(this.packedSnapshot);
        if (!inflated) return;
        insertAt(this.index, inflated);
        break;
      }
    }
  }

  redo(): void {
    switch (this.kind) {
      case 'add': {
        if (!this.packedSnapshot) return;
        const inflated = inflateLayerSnapshot(this.packedSnapshot);
        if (!inflated) return;
        insertAt(this.index, inflated);
        break;
      }
      case 'delete': {
        const id = this.packedSnapshot?.layer.id ?? projectStore.layers.layers[this.index]?.id;
        if (!id) return;
        removeLayer(id, { noDiff: true });
        break;
      }
    }
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {
        context: this.context,
        label: this.label,
        kind: this.kind,
        index: this.index,
        packedSnapshot: this.packedSnapshot,
      } as LayerListHistoryActionProps,
    };
  }
}

function insertAt(index: number, snapshot: LayerSnapshot) {
  const arr = [...projectStore.layers.layers];
  arr.splice(index, 0, snapshot.layer);
  setProjectStore('layers', 'layers', arr);
  const width = snapshot.image?.width ?? projectStore.canvas.size.width;
  const height = snapshot.image?.height ?? projectStore.canvas.size.height;
  const buffer = snapshot.image?.buffer ?? new Uint8ClampedArray(width * height * 4);
  layerManager.registerLayer(snapshot.layer.id, buffer, width, height, { inputSpace: 'layer' });
  updateWebGLCanvas(`Layer(${snapshot.layer.id}) inserted`);
  updateLayerPreview(snapshot.layer.id);
}
