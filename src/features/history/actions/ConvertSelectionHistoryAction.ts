import { ImagePoolEntry, ImagePoolImage } from '~/features/image_pool';
import { clearImagePoolBlobUrls } from '~/features/image_pool/blobManager';
import { setImagePoolImages } from '~/features/image_pool/imageStore';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { cancelMove } from '~/features/selection/SelectionOperator';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateFrascoCanvas } from '~/webgl/service';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';
import { LayerSnapshot, PackedLayerSnapshot } from './types';
import { inflateLayerSnapshot } from './utils';

/**
 * History action for Converting selection into image.
 * If convertion done with delete, undoing this will revert "add image" and "delete selection" by removing image and restore selection.
 * Otherwise (convert/cut), this will works as same as ImagePoolHistory(add).
 */
export interface ConvertSelectionHistoryActionProps extends BaseHistoryActionProps {
  layerId: string;
  beforeSnapshot?: PackedLayerSnapshot;
  afterSnapshot?: PackedLayerSnapshot;
  oldEntries: ImagePoolEntry[];
  newEntries: ImagePoolEntry[];
  oldImages?: Map<string, ImagePoolImage>;
  newImages?: Map<string, ImagePoolImage>;
}

export class ConvertSelectionHistoryAction extends BaseHistoryAction {
  readonly type = 'convert_selection';

  layerId: string;

  oldEntries: ImagePoolEntry[];
  newEntries: ImagePoolEntry[];
  oldImages?: Map<string, ImagePoolImage>;
  newImages?: Map<string, ImagePoolImage>;
  beforeSnapshot?: PackedLayerSnapshot;
  afterSnapshot?: PackedLayerSnapshot;

  constructor(public readonly props: ConvertSelectionHistoryActionProps) {
    super(props);

    this.layerId = props.layerId;
    this.oldEntries = props.oldEntries;
    this.newEntries = props.newEntries;
    this.oldImages = props.oldImages ?? new Map();
    this.newImages = props.newImages ?? new Map();
    this.beforeSnapshot = props.beforeSnapshot;
    this.afterSnapshot = props.afterSnapshot;
  }

  undo(): void {
    clearImagePoolBlobUrls();
    setProjectStore('imagePool', 'entries', [...this.oldEntries]);
    if (this.oldImages) setImagePoolImages(this.oldImages);

    if (this.beforeSnapshot) {
      if (floatingMoveManager.isMoving()) {
        cancelMove();
        return;
      }
      const inflated = inflateLayerSnapshot(this.beforeSnapshot);
      if (inflated) this.applySnapshot(inflated);
    }

    updateFrascoCanvas(`Anvil(${this.layerId}) undo`);
  }

  redo(): void {
    clearImagePoolBlobUrls();
    setProjectStore('imagePool', 'entries', [...this.newEntries]);
    if (this.newImages) setImagePoolImages(this.newImages);

    if (this.afterSnapshot) {
      if (floatingMoveManager.isMoving()) {
        cancelMove();
        return;
      }
      const inflated = inflateLayerSnapshot(this.afterSnapshot);
      if (inflated) this.applySnapshot(inflated);
    }

    updateFrascoCanvas(`Anvil(${this.layerId}) redo`);
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {
        context: this.context,
        label: this.label,
        layerId: this.layerId,
        beforeSnapshot: this.beforeSnapshot,
        afterSnapshot: this.afterSnapshot,
        oldEntries: this.props.oldEntries,
        newEntries: this.props.newEntries,
        oldImages: this.oldImages,
        newImages: this.newImages,
      } as ConvertSelectionHistoryActionProps,
    };
  }

  private applySnapshot(snapshot: LayerSnapshot) {
    const width = snapshot.image?.width ?? 0;
    const height = snapshot.image?.height ?? 0;
    const buffer = snapshot.image?.buffer;
    if (!buffer || width <= 0 || height <= 0) return;
    layerManager.replaceLayerBuffer(snapshot.layer.id, buffer, width, height, { inputSpace: 'layer' });
  }
}
