import { Component, onMount } from 'solid-js';
import { clipboardCopy, clipboardCut, clipboardPaste } from './ClipboardActions';

const ClipboardListener: Component = () => {
  onMount(() => {
    document.addEventListener('copy', clipboardCopy);
    document.addEventListener('cut', clipboardCut);
    document.addEventListener('paste', clipboardPaste);

    return () => {
      document.removeEventListener('copy', clipboardCopy);
      document.removeEventListener('cut', clipboardCut);
      document.removeEventListener('paste', clipboardPaste);
    };
  });

  return null;
};

export default ClipboardListener;
