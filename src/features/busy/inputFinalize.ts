import { logSystemError } from '~/features/log/service';

const LOG_LABEL = 'InputFinalize';

export type InputFinalizer = () => void;

const finalizers = new Set<InputFinalizer>();

/**
 * @description register something that has to be settled before an exclusive operation reads the project:
 *   a stroke that is still being drawn, a transform still under the pointer, a history entry waiting on a
 *   timer. returns the function that unregisters it.
 *
 *   a finalizer must leave the editor in a committed state - the gesture ended at its last input position,
 *   its history entry registered, its pointer capture and timers released - rather than merely stopping.
 *   what a save reads has to match what the user sees and what undo will walk back through.
 */
export function registerInputFinalizer(finalizer: InputFinalizer): () => void {
  finalizers.add(finalizer);
  return () => {
    finalizers.delete(finalizer);
  };
}

/**
 * @description settle every gesture and pending history entry that is still open.
 *
 *   called before the first await of an exclusive operation, so nothing it reads can still be halfway
 *   through. one finalizer failing must not leave the rest unrun, so each is reported and stepped over.
 */
export function finalizePendingInput(): void {
  // blur first: a focused input commits its value on blur, and that commit can itself be what a finalizer
  // below has to register.
  const active = document.activeElement;
  if (active instanceof HTMLElement && isEditableElement(active)) active.blur();

  // walk a copy: a finalizer is free to unregister itself as it settles.
  for (const finalizer of [...finalizers]) {
    try {
      finalizer();
    } catch (error) {
      logSystemError('Failed to finalize pending input.', { label: LOG_LABEL, details: [error] });
    }
  }
}

function isEditableElement(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || element.isContentEditable;
}
