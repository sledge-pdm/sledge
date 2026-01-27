import { Component, onMount } from 'solid-js';
import { clipboardCopy, clipboardCut, clipboardPaste } from './ClipboardActions';

const ClipboardListener: Component = () => {
  const copy = (e: ClipboardEvent) => clipboardCopy(e);
  const cut = (e: ClipboardEvent) => clipboardCut(e);
  const paste = (e: ClipboardEvent) => clipboardPaste(e);

  onMount(() => {
    document.addEventListener('copy', copy);
    document.addEventListener('cut', cut);
    document.addEventListener('paste', paste);

    return () => {
      document.removeEventListener('copy', copy);
      document.removeEventListener('cut', cut);
      document.removeEventListener('paste', paste);
    };
  });

  return null;
};

export default ClipboardListener;
