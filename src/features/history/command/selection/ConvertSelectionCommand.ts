import { inflateLayerSnapshot, LayerSnapshot, PackedLayerSnapshot } from '~/features/history/snapshot';
import { ImagePoolEntry, ImagePoolImage } from '~/features/image_pool';
import { clearImagePoolBlobUrls } from '~/features/image_pool/blobManager';
import { setImagePoolImages } from '~/features/image_pool/imageStore';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { cancelMove } from '~/features/selection/service';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateFrascoCanvas } from '~/webgl/service';
import { HistoryContext } from '../../types';
import { HistoryCommand } from '../HistoryCommand';
import { registerHistoryCommand } from '../registry';

export interface ConvertSelectionCommandProps {
  layerId: string;
  beforeSnapshot?: PackedLayerSnapshot;
  afterSnapshot?: PackedLayerSnapshot;
  oldEntries: ImagePoolEntry[];
  newEntries: ImagePoolEntry[];
  oldImages?: Map<string, ImagePoolImage>;
  newImages?: Map<string, ImagePoolImage>;
}

/**
 * @deprecated this should be replaced with ImagePool+Selection+FrascoLayer snippet after adding SelectionCommand
 */
export class ConvertSelectionCommand extends HistoryCommand {
  private readonly props: ConvertSelectionCommandProps;
  private layerId: string;
  private oldEntries: ImagePoolEntry[];
  private newEntries: ImagePoolEntry[];
  private oldImages?: Map<string, ImagePoolImage>;
  private newImages?: Map<string, ImagePoolImage>;
  private beforeSnapshot?: PackedLayerSnapshot;
  private afterSnapshot?: PackedLayerSnapshot;

  constructor(props: ConvertSelectionCommandProps) {
    super('convert_selection');
    this.props = props;
    this.layerId = props.layerId;
    this.oldEntries = props.oldEntries;
    this.newEntries = props.newEntries;
    this.oldImages = props.oldImages ?? new Map();
    this.newImages = props.newImages ?? new Map();
    this.beforeSnapshot = props.beforeSnapshot;
    this.afterSnapshot = props.afterSnapshot;
  }

  forward(): void {
    this.applyNew();
  }

  backward(): void {
    this.applyOld();
  }

  getContext(): HistoryContext {
    const cut = this.beforeSnapshot && this.afterSnapshot;
    return { icon: '/assets/icons/actions/image.png', description: cut ? 'convert selection (cut)' : 'convert selection' };
  }

  serializeProps(): ConvertSelectionCommandProps {
    return {
      ...this.props,
      layerId: this.layerId,
      oldEntries: this.oldEntries,
      newEntries: this.newEntries,
      oldImages: this.oldImages,
      newImages: this.newImages,
      beforeSnapshot: this.beforeSnapshot,
      afterSnapshot: this.afterSnapshot,
    };
  }

  private applyOld() {
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

  private applyNew() {
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

  private applySnapshot(snapshot: LayerSnapshot) {
    const width = snapshot.image?.width ?? 0;
    const height = snapshot.image?.height ?? 0;
    const buffer = snapshot.image?.buffer;
    if (!buffer || width <= 0 || height <= 0) return;
    layerManager.replaceLayerBuffer(snapshot.layer.id, buffer, width, height, { inputSpace: 'layer' });
  }
}

registerHistoryCommand('convert_selection', (props) => new ConvertSelectionCommand(props as ConvertSelectionCommandProps));
