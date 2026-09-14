import { logSystemWarn, logUserWarn } from '~/features/log/service';
import { closeContextMenu } from '~/utils/contextMenu/store';
import { busyStore, createDefaultBusyState, setBusyStore } from './store';
import { BUSY_LABELS, type BusyOperationId, type BusyProgress } from './types';

const LOG_LABEL = 'Busy';

/**
 * @description handed to the body of a `runExclusive`, so it can report its own progress without reaching
 *   into the store and without being able to end the exclusive period early.
 */
export interface BusyHandle {
  readonly operation: BusyOperationId;
  setProgress(progress: BusyProgress | undefined): void;
  /**
   * @description put the modal up, for an operation started with `deferDialog`. only ever turns the modal
   *   on: a step inheriting someone else's period must not be able to take their modal down.
   */
  presentDialog(): void;
}

/**
 * - `acquire` (default): take the window, or turn the call down if something else already has it.
 * - `inherit`: run inside the period the caller already holds, for inner steps that must not release and
 *   re-take it partway through.
 * - `skip`: run with no exclusion. only for the startup load, which runs before there is a window to take.
 */
export type BusyMode = 'acquire' | 'inherit' | 'skip';

export interface RunExclusiveOptions<T> {
  mode?: BusyMode;
  /** @description overrides the operation's usual wording in the modal. */
  label?: string;
  /**
   * @description take the window but leave the modal down until the body calls `presentDialog()`, for an
   *   operation that opens a native dialog first. the restriction is on from the start either way.
   *   ignored unless this call is the one acquiring, so an inherited step cannot hide the modal already up.
   */
  deferDialog?: boolean;
  /** @description what the caller gets back when the window is already taken. */
  onRejected?: () => T;
  /** @description said to the user when the window is already taken. */
  rejectionMessage?: string;
}

/** identity of the period currently holding the window; `undefined` while nothing does. */
let currentOwner: object | undefined;

/**
 * @description whether an operation holds the window. reads the store rather than `currentOwner`, because
 *   only a store write makes a `disabled={isBusy()}` re-evaluate. `runExclusive` sets and clears both.
 */
export function isBusy(): boolean {
  return busyStore.operation !== undefined;
}

export function currentBusyOperation(): BusyOperationId | undefined {
  return busyStore.operation;
}

/** @description report progress for the operation currently holding the window. */
export function setBusyProgress(progress: BusyProgress | undefined): void {
  if (!currentOwner) return;
  setBusyStore('progress', progress);
}

/**
 * @description run `body` with the window to itself. the window is taken before this function's first
 *   await, so a second operation arriving in the same tick finds it gone. released in a `finally`.
 */
export async function runExclusive<T>(
  operation: BusyOperationId,
  body: (handle: BusyHandle) => Promise<T>,
  options?: RunExclusiveOptions<T>
): Promise<T | undefined> {
  const mode = options?.mode ?? 'acquire';

  if (mode !== 'acquire') {
    // `inherit` runs as part of the caller's period, `skip` outside of any - neither may end one.
    return await body(makeHandle(operation, mode === 'inherit'));
  }

  if (currentOwner) {
    const runningLabel = busyStore.label || (busyStore.operation ? BUSY_LABELS[busyStore.operation] : 'another operation');
    logUserWarn(options?.rejectionMessage ?? `${runningLabel} is still running.`, { label: LOG_LABEL });
    return options?.onRejected?.();
  }

  const owner = {};
  currentOwner = owner;
  setBusyStore({
    operation,
    label: options?.label ?? BUSY_LABELS[operation],
    progress: undefined,
    dialogVisible: !options?.deferDialog,
  });
  // a context menu is mounted on `document.body`, outside the pane the modal covers and beyond its inert,
  // so one left open stays clickable. its items edit the project this operation is about to read.
  closeContextMenu();

  try {
    return await body(makeHandle(operation, true));
  } finally {
    if (currentOwner === owner) {
      currentOwner = undefined;
      setBusyStore(createDefaultBusyState());
    } else {
      // nothing releases the window but this block, so reaching here means the bookkeeping is wrong
      // somewhere else. say so rather than clearing state that now belongs to another operation.
      logSystemWarn('Busy owner changed while an exclusive operation was running.', { label: LOG_LABEL, details: [operation] });
    }
  }
}

/** @description put the modal up for the operation currently holding the window. never takes one down. */
function presentBusyDialog(): void {
  if (!currentOwner) return;
  setBusyStore('dialogVisible', true);
}

function makeHandle(operation: BusyOperationId, canReport: boolean): BusyHandle {
  return {
    operation,
    presentDialog: () => {
      if (canReport) presentBusyDialog();
    },
    setProgress: (progress) => {
      if (canReport) setBusyProgress(progress);
    },
  };
}
