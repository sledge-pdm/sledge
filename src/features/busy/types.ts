import type { SaveProgressPhase } from '~/utils/EventBus';

/**
 * @description operations that hold the window for themselves. each one either writes the project file or
 *   rebuilds the runtime, so it requires the state it reads to stay fixed for its whole run.
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

/** @description how a progress reading is written out, in the modal and in the bottom bar alike. */
export function formatProgress(progress: BusyProgress): string {
  return progress.total > 1 ? `${progress.phase} ${progress.done}/${progress.total}` : progress.phase;
}

export interface BusyState {
  /** @description the operation holding the window, or undefined when nothing is. */
  operation: BusyOperationId | undefined;
  /** @description what the modal calls it. */
  label: string;
  progress: BusyProgress | undefined;
  /**
   * @description whether the modal is up. separate from `operation` because an operation that opens a native
   *   dialog first holds the window from the start, and the OS dialog is already modal to this window.
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
