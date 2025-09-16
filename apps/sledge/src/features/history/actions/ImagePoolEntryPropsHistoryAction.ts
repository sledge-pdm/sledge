import { ImagePoolEntry, setEntry } from '~/features/image_pool';
import { BaseHistoryAction } from '../base';

// history action for changes in image pool entry property
export class ImagePoolEntryPropsHistoryAction extends BaseHistoryAction {
  readonly type = 'image_pool_entry_props' as const;

  constructor(
    public readonly entryId: string,
    public readonly oldEntryProps: Omit<ImagePoolEntry, 'id'>,
    public readonly newEntryProps: Omit<ImagePoolEntry, 'id'>,
    context?: any
  ) {
    super(context);
  }

  undo(): void {
    setEntry(this.entryId, { id: this.entryId, ...this.oldEntryProps });
  }

  redo(): void {
    setEntry(this.entryId, { id: this.entryId, ...this.newEntryProps });
  }
}
