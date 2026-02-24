import { HistoryContext, ImagePoolEntry, ImagePoolImage } from '@sledge-pdm/core';
import { HistoryCommand } from '../HistoryCommand';
import { registerHistoryCommand } from '../registry';
import { insertImagePoolEntry, removeImagePoolEntry } from './entryOps';

export interface ImagePoolRemoveCommandProps {
  entry: ImagePoolEntry;
  image?: ImagePoolImage;
  index: number;
}

export class ImagePoolRemoveCommand extends HistoryCommand {
  private readonly props: ImagePoolRemoveCommandProps;
  private entry: ImagePoolEntry;
  private image?: ImagePoolImage;
  private index: number;

  constructor(props: ImagePoolRemoveCommandProps) {
    super('image_pool_remove');
    this.props = props;
    this.entry = props.entry;
    this.image = props.image;
    this.index = props.index;
  }

  forward(): void {
    removeImagePoolEntry(this.entry.id);
  }

  backward(): void {
    insertImagePoolEntry(this.entry, this.index, this.image);
  }

  getContext(): HistoryContext {
    const label = this.entry.descriptionName ?? this.entry.id;
    return { icon: '/assets/icons/actions/image.png', description: `remove image / ${label}` };
  }

  serializeProps(): ImagePoolRemoveCommandProps {
    return { ...this.props, entry: this.entry, image: this.image, index: this.index };
  }
}

registerHistoryCommand('image_pool_remove', (props) => new ImagePoolRemoveCommand(props as ImagePoolRemoveCommandProps));
