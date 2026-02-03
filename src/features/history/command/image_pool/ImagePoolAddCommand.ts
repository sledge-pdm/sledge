import { HistoryContext } from '~/features/history/types';
import { ImagePoolEntry, ImagePoolImage } from '~/features/image_pool';
import { removeImagePoolBlobUrl } from '~/features/image_pool/blobManager';
import { removeImagePoolImage, setImagePoolImage } from '~/features/image_pool/imageStore';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { HistoryCommand } from '../HistoryCommand';
import { registerHistoryCommand } from '../registry';

export interface ImagePoolAddCommandProps {
  entry: ImagePoolEntry;
  image?: ImagePoolImage;
  index: number;
}

export class ImagePoolAddCommand extends HistoryCommand {
  private readonly props: ImagePoolAddCommandProps;
  private entry: ImagePoolEntry;
  private image?: ImagePoolImage;
  private index: number;

  constructor(props: ImagePoolAddCommandProps) {
    super('image_pool_add');
    this.props = props;
    this.entry = props.entry;
    this.image = props.image;
    this.index = props.index;
  }

  forward(): void {
    this.insertEntry();
  }

  backward(): void {
    this.removeEntry();
  }

  getContext(): HistoryContext {
    const label = this.entry.descriptionName ?? this.entry.id;
    return { icon: '/assets/icons/actions/image.png', description: `add image / ${label}` };
  }

  serializeProps(): ImagePoolAddCommandProps {
    return { ...this.props, entry: this.entry, image: this.image, index: this.index };
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

registerHistoryCommand('image_pool_add', (props) => new ImagePoolAddCommand(props as ImagePoolAddCommandProps));
