import { HistoryContext, ImagePoolEntry } from '@sledge-pdm/core';
import { cloneEntry } from '~/features/image_pool';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { HistoryCommand } from '../HistoryCommand';
import { registerHistoryCommand } from '../registry';

export interface ImagePoolPropsCommandProps {
  entryId: string;
  before?: ImagePoolEntry;
  after?: ImagePoolEntry;
}

export class ImagePoolPropsCommand extends HistoryCommand {
  private readonly props: ImagePoolPropsCommandProps;
  private entryId: string;
  private before?: ImagePoolEntry;
  private after?: ImagePoolEntry;

  constructor(props: ImagePoolPropsCommandProps) {
    super('image_pool_props');
    this.props = props;
    this.entryId = props.entryId;
    this.before = props.before ? cloneEntry(props.before) : undefined;
    this.after = props.after ? cloneEntry(props.after) : undefined;
  }

  forward(): void {
    if (!this.after) return;
    this.applyEntry(this.after);
  }

  backward(): void {
    if (!this.before) return;
    this.applyEntry(this.before);
  }

  getContext(): HistoryContext {
    const label = this.after?.descriptionName ?? this.before?.descriptionName ?? this.entryId;
    return { icon: '/assets/icons/actions/image.png', description: `update image / ${label}` };
  }

  serializeProps(): ImagePoolPropsCommandProps {
    return {
      ...this.props,
      entryId: this.entryId,
      before: this.before ? cloneEntry(this.before) : undefined,
      after: this.after ? cloneEntry(this.after) : undefined,
    };
  }

  private applyEntry(entry: ImagePoolEntry) {
    const index = projectStore.imagePool.entries.findIndex((e) => e.id === this.entryId);
    if (index < 0) return;
    setProjectStore('imagePool', 'entries', index, {
      ...cloneEntry(entry),
      id: this.entryId,
    });
  }
}

registerHistoryCommand('image_pool_props', (props) => new ImagePoolPropsCommand(props as ImagePoolPropsCommandProps));
