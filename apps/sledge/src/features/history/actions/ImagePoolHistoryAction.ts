import { ImagePoolEntry } from '~/features/image_pool';
import { setImagePoolStore } from '~/stores/ProjectStores';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

export interface ImagePoolHistoryActionProps extends BaseHistoryActionProps {
  kind: 'add' | 'remove';
  oldEntries: ImagePoolEntry[];
  newEntries: ImagePoolEntry[];
}

// history action for changes in image pool
export class ImagePoolHistoryAction extends BaseHistoryAction {
  readonly type = 'image_pool' as const;

  kind: 'add' | 'remove';
  oldEntries: ImagePoolEntry[];
  newEntries: ImagePoolEntry[];

  constructor(public readonly props: ImagePoolHistoryActionProps) {
    super(props);
    this.kind = props.kind;
    this.oldEntries = props.oldEntries;
    this.newEntries = props.newEntries;
  }

  undo(): void {
    switch (this.kind) {
      case 'add':
        setImagePoolStore('entries', this.oldEntries);
        break;
      case 'remove':
        setImagePoolStore('entries', this.oldEntries);
        break;
    }
  }

  redo(): void {
    switch (this.kind) {
      case 'add':
        setImagePoolStore('entries', this.newEntries);
        break;
      case 'remove':
        setImagePoolStore('entries', this.newEntries);
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
        oldEntries: this.props.oldEntries,
        newEntries: this.props.newEntries,
      } as ImagePoolHistoryActionProps,
    };
  }
}
