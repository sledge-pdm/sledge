import type { SaveProgressPhase } from '~/utils/EventBus';

/**
 * @description the operations that take the window for themselves while they run.
 *   everything here either writes the project file or rebuilds the runtime from something outside it, so
 *   letting a second one start - or letting the user edit underneath one - would have it working from a
 *   state that no longer exists.
 */
export type BusyOperationId =
  | 'save'
  | 'quit'
  | 'projectLoad'
  | 'imageImport'
  | 'imageTransfer'
  | 'clipboardCopy'
  | 'clipboardCut'
  | 'clipboardPaste'
  | 'selectionToImage'
  | 'snapshotCreate'
  | 'snapshotDelete'
  | 'snapshotLoad';

/** @description how far the running operation has got. absent while an operation has nothing to count. */
export interface BusyProgress {
  /** @description saves name their stretch; everything else has a single one. */
  phase: SaveProgressPhase | string;
  done: number;
  total: number;
}

export interface BusyState {
  /** @description the operation holding the window, or undefined when nothing is. */
  operation: BusyOperationId | undefined;
  /** @description what the modal calls it. */
  label: string;
  progress: BusyProgress | undefined;
  /**
   * @description whether the modal is up. separate from `operation`, because an operation that opens a
   *   native dialog first holds the window from the start but has nothing worth covering the window for
   *   until that dialog is answered - the OS dialog is modal to this window anyway, and putting ours up
   *   behind it only means the user stares at it while picking a folder.
   *
   *   the restriction never waits on this: the input guards read `operation`.
   */
  dialogVisible: boolean;
}

/** @description what the modal says while each operation runs. */
export const BUSY_LABELS: Record<BusyOperationId, string> = {
  save: 'saving project',
  // covers the unsaved-changes prompt as well as the save that answers it, so it is named for the whole.
  quit: 'quitting',
  projectLoad: 'loading project',
  imageImport: 'importing image',
  imageTransfer: 'transferring image',
  clipboardCopy: 'copying',
  clipboardCut: 'cutting',
  clipboardPaste: 'pasting',
  selectionToImage: 'converting selection',
  snapshotCreate: 'creating snapshot',
  snapshotDelete: 'deleting snapshot',
  snapshotLoad: 'loading snapshot',
};
