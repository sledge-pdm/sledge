import { HistoryContext } from '~/features/history/types';
import { ImagePoolEntry, ImagePoolImage } from '~/features/image_pool';
import { removeImagePoolBlobUrl } from '~/features/image_pool/blobManager';
import { removeImagePoolImage, setImagePoolImage } from '~/features/image_pool/imageStore';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { HistoryCommand } from '../HistoryCommand';

export interface ImagePoolEntryCommandProps {
  kind: 'add' | 'remove';
  entry: ImagePoolEntry;
  image?: ImagePoolImage;
  index: number;
}

export class ImagePoolEntryCommand extends HistoryCommand {
  private kind: 'add' | 'remove';
  private entry: ImagePoolEntry;
  private image?: ImagePoolImage;
  private index: number;

  constructor(props: ImagePoolEntryCommandProps) {
    super('image_pool');
    this.kind = props.kind;
    this.entry = props.entry;
    this.image = props.image;
    this.index = props.index;
  }

  forward(): void {
    if (this.kind === 'add') {
      this.insertEntry();
      return;
    }
    this.removeEntry();
  }

  backward(): void {
    if (this.kind === 'add') {
      this.removeEntry();
      return;
    }
    this.insertEntry();
  }

  getContext(): HistoryContext {
    const label = this.entry.descriptionName ?? this.entry.id;
    return { icon: '/assets/icons/actions/image.png', description: `${this.kind} image / ${label}` };
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
