import { ImagePoolEntry, setEntry } from '~/features/image_pool';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

export interface ImagePoolEntryPropsHistoryActionProps extends BaseHistoryActionProps {
  entryId: string;
  oldEntryProps: Omit<ImagePoolEntry, 'id'>;
  newEntryProps: Omit<ImagePoolEntry, 'id'>;
}

// history action for changes in image pool entry property
export class ImagePoolEntryPropsHistoryAction extends BaseHistoryAction {
  readonly type = 'image_pool_entry_props' as const;

  entryId: string;
  oldEntryProps: Omit<ImagePoolEntry, 'id'>;
  newEntryProps: Omit<ImagePoolEntry, 'id'>;

  constructor(public readonly props: ImagePoolEntryPropsHistoryActionProps) {
    super(props);
    this.entryId = props.entryId;
    this.oldEntryProps = props.oldEntryProps;
    this.newEntryProps = props.newEntryProps;
  }

  undo(): void {
    setEntry(this.entryId, { id: this.entryId, ...this.oldEntryProps });
  }

  redo(): void {
    setEntry(this.entryId, { id: this.entryId, ...this.newEntryProps });
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {
        context: this.context,
        label: this.label,
        entryId: this.entryId,
        oldEntryProps: this.oldEntryProps,
        newEntryProps: this.newEntryProps,
      } as ImagePoolEntryPropsHistoryActionProps,
    };
  }
}
