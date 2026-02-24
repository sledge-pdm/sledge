import { HistoryContext, ImagePoolEntry, ImagePoolImage } from '@sledge-pdm/core';
import { HistoryCommand } from '../HistoryCommand';
import { registerHistoryCommand } from '../registry';
import { insertImagePoolEntry, removeImagePoolEntry } from './entryOps';

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
    insertImagePoolEntry(this.entry, this.index, this.image);
  }

  backward(): void {
    removeImagePoolEntry(this.entry.id);
  }

  getContext(): HistoryContext {
    const label = this.entry.descriptionName ?? this.entry.id;
    return { icon: '/assets/icons/actions/image.png', description: `add image / ${label}` };
  }

  serializeProps(): ImagePoolAddCommandProps {
    return { ...this.props, entry: this.entry, image: this.image, index: this.index };
  }
}

registerHistoryCommand('image_pool_add', (props) => new ImagePoolAddCommand(props as ImagePoolAddCommandProps));
