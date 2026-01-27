import { gzipDeflate } from '@sledge-pdm/core';
import { SurfaceBounds } from '@sledge-pdm/frasco';
import { getLayerIndex } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';
import { LayerSnapshot, PackedLayerSnapshot } from '../../actions/types';
import { inflateLayerSnapshot } from '../../actions/utils';
import { HistoryContext } from '../../types';
import { HistoryCommand } from '../HistoryCommand';

export interface LayerMergeCommandProps {
  originIndex: number;
  targetIndex: number;
  activeLayerId: string;
  originPackedSnapshot?: PackedLayerSnapshot;
  targetPackedSnapshot?: PackedLayerSnapshot;
}

export class LayerMergeCommand extends HistoryCommand {
  private originIndex: number;
  private targetIndex: number;
  private activeLayerId: string;
  private originPackedSnapshot?: PackedLayerSnapshot;
  private targetPackedSnapshot?: PackedLayerSnapshot;

  constructor(props: LayerMergeCommandProps) {
    super('layer_merge');
    this.originIndex = props.originIndex;
    this.targetIndex = props.targetIndex;
    this.activeLayerId = props.activeLayerId;
    this.originPackedSnapshot = props.originPackedSnapshot ?? this.getSnapshot(this.originIndex);
    this.targetPackedSnapshot = props.targetPackedSnapshot ?? this.getSnapshot(this.targetIndex);
  }

  forward(): void {
    this.swapSnapshots();
  }

  backward(): void {
    this.swapSnapshots();
  }

  getContext(): HistoryContext {
    const originName = this.originPackedSnapshot?.layer.name ?? 'unknown';
    const targetName = this.targetPackedSnapshot?.layer.name ?? 'unknown';
    return { icon: '/assets/icons/actions/layer.png', description: `merge / ${originName} > ${targetName}` };
  }

  private getSnapshot(index: number): PackedLayerSnapshot | undefined {
    const layer = projectStore.layers.layers[index];
    if (!layer) return;
    const frascoLayer = layerManager.getLayerOptional(layer.id);
    if (!frascoLayer) return;
    const buffer = frascoLayer.readPixels();
    return {
      layer: { ...layer },
      image: { packedBuffer: gzipDeflate(buffer), width: frascoLayer.getWidth(), height: frascoLayer.getHeight() },
    };
  }

  private applySnapshot(snapshot?: LayerSnapshot) {
    if (!snapshot) return;

    const idx = getLayerIndex(snapshot.layer.id);
    if (idx >= 0) {
      setProjectStore('layers', 'layers', idx, snapshot.layer);

      if (snapshot.image) {
        const frascoLayer = layerManager.getLayerOptional(snapshot.layer.id);
        if (frascoLayer) {
          const bounds: SurfaceBounds = { x: 0, y: 0, width: snapshot.image.width, height: snapshot.image.height };
          frascoLayer.writePixels(snapshot.image.buffer, { bounds });
        }
      }
    }
    updateLayerPreview(snapshot.layer.id);
  }

  private swapSnapshots() {
    if (!this.originPackedSnapshot || !this.targetPackedSnapshot) {
      throw new Error(
        `Layer merge snapshots are missing. Cannot perform undo/redo operation. ` +
          `originPackedSnapshot: ${this.originPackedSnapshot ? 'present' : 'missing'}, ` +
          `targetPackedSnapshot: ${this.targetPackedSnapshot ? 'present' : 'missing'}.`
      );
    }
    const swapOriginPackedSnapshot = this.getSnapshot(this.originIndex);
    const swapTargetPackedSnapshot = this.getSnapshot(this.targetIndex);
    const swapActiveLayerId = projectStore.layers.state.activeLayerId;

    setProjectStore('layers', 'state', 'activeLayerId', this.activeLayerId);

    this.applySnapshot(inflateLayerSnapshot(this.originPackedSnapshot));
    this.applySnapshot(inflateLayerSnapshot(this.targetPackedSnapshot));

    updateWebGLCanvas('Layer merge undo/redo');

    this.originPackedSnapshot = swapOriginPackedSnapshot;
    this.targetPackedSnapshot = swapTargetPackedSnapshot;
    this.activeLayerId = swapActiveLayerId;
  }
}
