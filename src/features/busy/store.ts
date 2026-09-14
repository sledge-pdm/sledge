import { createStore } from 'solid-js/store';
import type { BusyState } from './types';

export const createDefaultBusyState = (): BusyState => ({
  operation: undefined,
  label: '',
  progress: undefined,
  dialogVisible: false,
});

/**
 * @description the one place that says whether this window is busy. the modal, the save button and every
 *   input entry point read it from here rather than each working it out from the progress stream - a
 *   listener that infers "running" from progress events only learns about the stretches that report any,
 *   and learns nothing at all about the dialogs on either side of them.
 */
export const [busyStore, setBusyStore] = createStore<BusyState>(createDefaultBusyState());
