import { ImagePoolEntry, insertEntry, removeEntry } from '~/features/image_pool';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

export interface ImagePoolHistoryActionProps extends BaseHistoryActionProps {
  kind: 'add' | 'remove';
  targetEntry: ImagePoolEntry;
}

// history action for changes in image pool
export class ImagePoolHistoryAction extends BaseHistoryAction {
  readonly type = 'image_pool' as const;

  kind: 'add' | 'remove';
  targetEntry: ImagePoolEntry;

  constructor(public readonly props: ImagePoolHistoryActionProps) {
    super(props);
    this.kind = props.kind;
    this.targetEntry = props.targetEntry;
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

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {
        context: this.context,
        label: this.label,
        kind: this.kind,
        targetEntry: this.targetEntry,
      } as ImagePoolHistoryActionProps,
    };
  }
}
