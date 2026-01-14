import { ImagePoolEntry, ImagePoolImagePersisted } from '~/features/image_pool';
import { makeRuntimeImages } from '~/features/image_pool/service';
import { imagePoolStore, setImagePoolStore } from '~/stores/ProjectStores';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

export interface ImagePoolHistoryActionProps extends BaseHistoryActionProps {
  kind: 'add' | 'remove';
  oldEntries: ImagePoolEntry[];
  newEntries: ImagePoolEntry[];
  oldImages?: Map<string, ImagePoolImagePersisted>;
  newImages?: Map<string, ImagePoolImagePersisted>;
}

// history action for changes in image pool
export class ImagePoolHistoryAction extends BaseHistoryAction {
  readonly type = 'image_pool' as const;

  kind: 'add' | 'remove';
  oldEntries: ImagePoolEntry[];
  newEntries: ImagePoolEntry[];
  oldImages: Map<string, ImagePoolImagePersisted>;
  newImages: Map<string, ImagePoolImagePersisted>;

  constructor(public readonly props: ImagePoolHistoryActionProps) {
    super(props);
    this.kind = props.kind;
    this.oldEntries = props.oldEntries;
    this.newEntries = props.newEntries;
    this.oldImages = props.oldImages ?? new Map();
    this.newImages = props.newImages ?? new Map();
  }

  undo(): void {
    imagePoolStore.images.forEach((image) => URL.revokeObjectURL(image.blobUrl));
    setImagePoolStore('entries', [...this.oldEntries]);
    setImagePoolStore('images', makeRuntimeImages(this.oldImages));
  }

  redo(): void {
    imagePoolStore.images.forEach((image) => URL.revokeObjectURL(image.blobUrl));
    setImagePoolStore('entries', [...this.newEntries]);
    setImagePoolStore('images', makeRuntimeImages(this.newImages));
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {
        context: this.context,
        label: this.label,
        kind: this.kind,
        oldEntries: this.props.oldEntries,
        newEntries: this.props.newEntries,
        oldImages: this.oldImages,
        newImages: this.newImages,
      } as ImagePoolHistoryActionProps,
    };
  }
}
