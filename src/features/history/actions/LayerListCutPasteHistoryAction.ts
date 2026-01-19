import { findLayerById, removeLayer, setActiveLayerId } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore, setProjectStore } from '~/stores/RuntimeProject';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';
import { LayerSnapshot, PackedLayerSnapshot } from './types';
import { inflateLayerSnapshot } from './utils';

export interface LayerListCutPasteHistoryActionProps extends BaseHistoryActionProps {
  sourcePackedSnapshot: PackedLayerSnapshot;
  sourceIndex: number;
  targetPackedSnapshot: PackedLayerSnapshot;
  targetIndex: number;
  activeLayerIdBefore: string;
  activeLayerIdAfter: string;
}

export class LayerListCutPasteHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_list_cut_paste' as const;

  // cutで消される側 (cutFreeze = true想定)
  sourcePackedSnapshot: PackedLayerSnapshot;
  sourceIndex: number;
  // pasteで追加される側 (cutFreeze = false想定)
  targetPackedSnapshot: PackedLayerSnapshot;
  targetIndex: number;

  activeLayerIdBefore: string;
  activeLayerIdAfter: string;

  constructor(public readonly props: LayerListCutPasteHistoryActionProps) {
    super(props);
    this.sourcePackedSnapshot = props.sourcePackedSnapshot;
    this.sourceIndex = props.sourceIndex;
    this.targetPackedSnapshot = props.targetPackedSnapshot;
    this.targetIndex = props.targetIndex;
    this.activeLayerIdBefore = props.activeLayerIdBefore;
    this.activeLayerIdAfter = props.activeLayerIdAfter;
  }

  undo(): void {
    // remove inserted
    removeLayer(this.targetPackedSnapshot.layer.id, { noDiff: true });
    // restore original (with cutFreeze true)
    const inflated = inflateLayerSnapshot(this.sourcePackedSnapshot);
    if (inflated) this.reinsert(this.sourceIndex, inflated);
    setActiveLayerId(this.activeLayerIdBefore);
    updateWebGLCanvas('CutPaste undo');
  }

  redo(): void {
    // ensure original exists then remove
    const orig = findLayerById(this.sourcePackedSnapshot.layer.id);
    if (orig) removeLayer(orig.id, { noDiff: true });
    // insert pasted (cutFreeze false)
    const inflated = inflateLayerSnapshot(this.targetPackedSnapshot);
    if (inflated) this.reinsert(this.targetIndex, inflated);
    setActiveLayerId(this.activeLayerIdAfter);
    updateWebGLCanvas('CutPaste redo');
  }

  private reinsert(index: number, packed: LayerSnapshot) {
    // 元スナップショットの layer.id を保持するため addLayerTo は使わず直接配列操作する。
    const arr = [...projectStore.layers.layers];
    arr.splice(index, 0, packed.layer);
    setProjectStore('layers', 'layers', arr);

    const width = packed.image?.width ?? projectStore.canvas.size.width;
    const height = packed.image?.height ?? projectStore.canvas.size.height;
    const buffer = packed.image?.buffer ?? new Uint8ClampedArray(width * height * 4);
    layerManager.registerLayer(packed.layer.id, buffer, width, height, { inputSpace: 'layer' });

    updateWebGLCanvas(`CutPaste reinsert (${packed.layer.id})`);
    updateLayerPreview(packed.layer.id);
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {
        context: this.context,
        label: this.label,
        sourcePackedSnapshot: this.sourcePackedSnapshot,
        sourceIndex: this.sourceIndex,
        targetPackedSnapshot: this.targetPackedSnapshot,
        targetIndex: this.targetIndex,
        activeLayerIdBefore: this.activeLayerIdBefore,
        activeLayerIdAfter: this.activeLayerIdAfter,
      } as LayerListCutPasteHistoryActionProps,
    };
  }
}
