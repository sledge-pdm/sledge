import { webpToRaw } from '@sledge/anvil';
import { PackedLayerSnapshot } from '~/features/history/actions/types';
import { findLayerById, removeLayer, setActiveLayerId } from '~/features/layer';
import { anvilManager, getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { canvasStore, layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

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
    this.reinsert(this.sourceIndex, this.sourcePackedSnapshot);
    setActiveLayerId(this.activeLayerIdBefore);
    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'CutPaste undo' });
  }

  redo(): void {
    // ensure original exists then remove
    const orig = findLayerById(this.sourcePackedSnapshot.layer.id);
    if (orig) removeLayer(orig.id, { noDiff: true });
    // insert pasted (cutFreeze false)
    this.reinsert(this.targetIndex, this.targetPackedSnapshot);
    setActiveLayerId(this.activeLayerIdAfter);
    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'CutPaste redo' });
  }

  private reinsert(index: number, packed: PackedLayerSnapshot) {
    // 元スナップショットの layer.id を保持するため addLayerTo は使わず直接配列操作する。
    const arr = [...layerListStore.layers];
    arr.splice(index, 0, packed.layer);
    setLayerListStore('layers', arr);

    const anvil = getAnvilOf(packed.layer.id);
    if (packed.image) {
      const width = packed.image.width;
      const height = packed.image.height;
      if (anvil) {
        anvil.importWebp(packed.image.webpBuffer, width, height);
      } else {
        const rawBuffer = webpToRaw(packed.image.webpBuffer, width, height);
        anvilManager.registerAnvil(packed.layer.id, rawBuffer, width, height);
      }
    } else {
      const width = canvasStore.canvas.width;
      const height = canvasStore.canvas.height;
      const rawBuffer = new Uint8ClampedArray(width * height * 4);
      if (anvil) {
        anvil.replaceBuffer(rawBuffer);
      } else {
        anvilManager.registerAnvil(packed.layer.id, rawBuffer, width, height);
      }
    }

    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: `CutPaste reinsert (${packed.layer.id})` });
    eventBus.emit('preview:requestUpdate', { layerId: packed.layer.id });
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
