import { ImagePoolEntry, ImagePoolImage } from '~/features/image_pool';
import { removeImagePoolBlobUrl } from '~/features/image_pool/blobManager';
import { removeImagePoolImage, setImagePoolImage } from '~/features/image_pool/imageStore';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

export interface ImagePoolHistoryActionProps extends BaseHistoryActionProps {
  kind: 'add' | 'remove';
  entry: ImagePoolEntry;
  image?: ImagePoolImage;
  index: number;
}

// history action for changes in image pool
export class ImagePoolHistoryAction extends BaseHistoryAction {
  readonly type = 'image_pool' as const;

  kind: 'add' | 'remove';
  entry: ImagePoolEntry;
  image?: ImagePoolImage;
  index: number;

  constructor(public readonly props: ImagePoolHistoryActionProps) {
    super(props);
    this.kind = props.kind;
    this.entry = props.entry;
    this.image = props.image;
    this.index = props.index;
  }

  undo(): void {
    if (this.kind === 'add') {
      this.removeEntry();
      return;
    }
    this.insertEntry();
  }

  redo(): void {
    if (this.kind === 'add') {
      this.insertEntry();
      return;
    }
    this.removeEntry();
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {
        context: this.context,
        label: this.label,
        kind: this.kind,
        entry: this.entry,
        image: this.image,
        index: this.index,
      } as ImagePoolHistoryActionProps,
    };
  }

  private insertEntry() {
    const current = projectStore.imagePool.entries;
    const next = [...current.filter((e) => e.id !== this.entry.id)];
    const index = Math.min(Math.max(this.index, 0), next.length);
    next.splice(index, 0, this.entry);
    removeImagePoolBlobUrl(this.entry.id);
    setProjectStore('imagePool', 'entries', next);
    if (this.image) {
      setImagePoolImage(this.entry.id, this.image);
    }
  }

  private removeEntry() {
    removeImagePoolBlobUrl(this.entry.id);
    setProjectStore(
      'imagePool',
      'entries',
      projectStore.imagePool.entries.filter((e) => e.id !== this.entry.id)
    );
    removeImagePoolImage(this.entry.id);
  }
}
