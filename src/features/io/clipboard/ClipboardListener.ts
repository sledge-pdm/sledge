import { Component, onCleanup, onMount } from 'solid-js';
import { isBusy } from '~/features/busy';
import { clipboardCopy, clipboardCut, clipboardPaste } from './ClipboardActions';

const ClipboardListener: Component = () => {
  /**
   * these are on `document`, so they reach us from anywhere in the window - including from behind the modal
   * a running operation puts up. the event is swallowed rather than passed on: acting on it would edit a
   * project that operation is in the middle of reading.
   */
  const blockedWhileBusy = (handler: (e: ClipboardEvent) => void) => (e: ClipboardEvent) => {
    if (isBusy()) {
      e.preventDefault();
      return;
    }
    handler(e);
  };

  const copy = blockedWhileBusy((e) => {
    clipboardCopy(e);
  });
  const cut = blockedWhileBusy((e) => {
    clipboardCut(e);
  });
  const paste = blockedWhileBusy((e) => {
    clipboardPaste(e);
  });

  onMount(() => {
    document.addEventListener('copy', copy);
    document.addEventListener('cut', cut);
    document.addEventListener('paste', paste);
  });

  onCleanup(() => {
    document.removeEventListener('copy', copy);
    document.removeEventListener('cut', cut);
    document.removeEventListener('paste', paste);
  });

  return null;
};

export default ClipboardListener;
