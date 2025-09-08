import { insertEntry, removeEntry } from '~/controllers/canvas/image_pool/ImagePoolController';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { BaseHistoryAction } from '../base';

// history action for changes in image pool
export class ImagePoolHistoryAction extends BaseHistoryAction {
  readonly type = 'image_pool' as const;

  constructor(
    public readonly kind: 'add' | 'remove',
    public readonly targetEntry: ImagePoolEntry,
    context?: any
  ) {
    super(context);
  }

  undo(): void {
    switch (this.kind) {
      case 'add':
        removeEntry(this.targetEntry.id, true);
        break;
      case 'remove':
        insertEntry(this.targetEntry, true);
        break;
    }
  }

  redo(): void {
    switch (this.kind) {
      case 'add':
        insertEntry(this.targetEntry, true);
        break;
      case 'remove':
        removeEntry(this.targetEntry.id, true);
        break;
    }
  }
}
