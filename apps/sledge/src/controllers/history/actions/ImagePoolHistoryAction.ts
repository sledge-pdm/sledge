import { addToImagePool, removeEntry } from '~/controllers/canvas/image_pool/ImagePoolController';
import { BaseHistoryAction } from '~/controllers/history/actions/BaseHistoryAction';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';

// history action for changes in image pool
export class ImagePoolHistoryAction extends BaseHistoryAction {
  readonly type = 'image_pool' as const;

  constructor(
    public readonly kind: 'add' | 'remove',
    public readonly targetEntry: ImagePoolEntry,
    context?: any // ex: "By user interact with opacity slider"
  ) {
    super(context);
  }

  // removeEntry and addToImagePool emits 'imagePool:entryChanged' event itself!

  undo(): void {
    switch (this.kind) {
      case 'add':
        // Remove the added entry
        removeEntry(this.targetEntry.id);
        break;
      case 'remove':
        // Re-add the removed entry
        addToImagePool(this.targetEntry.originalPath);
        break;
    }
  }

  redo(): void {
    switch (this.kind) {
      case 'add':
        addToImagePool(this.targetEntry.originalPath);
        break;
      case 'remove':
        // Remove the added entry
        removeEntry(this.targetEntry.id);
        break;
    }
  }
}
