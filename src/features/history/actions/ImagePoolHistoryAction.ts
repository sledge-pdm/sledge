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
    setImagePoolStore('entries', [...this.oldEntries]);
  }

  redo(): void {
    setImagePoolStore('entries', [...this.newEntries]);
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
