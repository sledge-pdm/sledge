import { logSystemError, logUserError } from '~/features/log/service';
import type { EditSession } from './types';

const LOG_LABEL = 'EditSession';

/** the sessions that are open right now. a session is in here for exactly as long as it is running. */
const openSessions = new Set<EditSession>();

/**
 * settling a session registers its history entry and can end other sessions as it goes, and those paths
 * run through the very guards that call in here. this says a settling pass is already under way, so a
 * second one cannot start inside it and walk the same sessions again.
 */
let settling = false;

/**
 * @description open a session and get back the function that closes it. call it from wherever the gesture
 *   actually starts - a pointerdown, `startMove` - not from a component's mount, so that the registry
 *   describes what is open rather than what could be.
 *
 *   closing is idempotent, so a session that settles itself part-way through `interrupt` or `finalize` can
 *   close there and let the caller close it again.
 */
export function beginEditSession(session: EditSession): () => void {
  openSessions.add(session);
  return () => {
    openSessions.delete(session);
  };
}

/**
 * @description whether any open session is holding captured state, so that editing now would corrupt it.
 *   the same polarity as `isBusy`: true is the restricted state, and a guard reads `if (…) refuse`.
 */
export function hasExclusiveEditSession(): boolean {
  for (const session of openSessions) {
    if (session.isExclusive()) return true;
  }
  return false;
}

/** @description what to call the sessions standing in the way, for a message to the user. */
export function exclusiveEditSessionLabels(): string[] {
  const labels: string[] = [];
  for (const session of openSessions) {
    if (session.isExclusive()) labels.push(session.label);
  }
  return labels;
}

/**
 * @description turn down an edit that would run over an open one, and say what has to be settled first.
 *   returns whether the caller must stop.
 *
 *   this rather than interrupting, for everything that is not undo or redo: cancelling someone's move
 *   because they reached for a filter would throw away work they never asked to discard, and committing it
 *   for them would put pixels down they never confirmed. the move has commit and cancel of its own, and
 *   this says so.
 */
export function refuseIfExclusiveEditSession(action: string): boolean {
  const labels = exclusiveEditSessionLabels();
  if (labels.length === 0) return false;
  logUserError(`commit or cancel ${labels.join(', ')} before ${action}.`, { label: LOG_LABEL });
  return true;
}

/**
 * @description end every session that is holding captured state, because the user has asked for something
 *   that conflicts with it. each session decides whether that means committing or cancelling.
 *
 *   returns whether anything was interrupted, so the caller can spend the gesture on the interruption
 *   rather than going on to do both: ctrl+z during a move cancels the move and leaves history alone, and
 *   only the next ctrl+z is an undo.
 */
export function interruptEditSessions(): boolean {
  return settleOpenSessions('interrupt');
}

/**
 * @description settle every session that is holding captured state, so an exclusive operation can read a
 *   project that is not halfway through anything. always commits - see `EditSession.finalize`.
 */
export function finalizeEditSessions(): void {
  // blur first: a focused input commits its value on blur, and that commit can itself be what a session
  // below has to register.
  const active = document.activeElement;
  if (active instanceof HTMLElement && isEditableElement(active)) active.blur();

  settleOpenSessions('finalize');
}

function settleOpenSessions(method: 'interrupt' | 'finalize'): boolean {
  if (settling) return false;
  settling = true;
  let settledAny = false;
  try {
    // walk a copy: settling a session closes it, and usually closes it from inside the call below.
    for (const session of [...openSessions]) {
      if (!session.isExclusive()) continue;
      try {
        session[method]();
        settledAny = true;
      } catch (error) {
        // one session failing must not leave the rest of them open - an operation is about to read past
        // all of them either way, so report this one and settle what is left.
        logSystemError(`Failed to ${method} edit session.`, { label: LOG_LABEL, details: [session.label, error] });
      }
    }
  } finally {
    settling = false;
  }
  return settledAny;
}

function isEditableElement(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || element.isContentEditable;
}
