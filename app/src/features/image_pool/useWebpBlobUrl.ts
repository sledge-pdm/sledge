import { createMemo, onCleanup } from 'solid-js';

export const useWebpBlobUrl = (webpBuffer: Uint8Array | undefined) => {
  let currentBlobUrl: string | undefined;

  const blobUrl = createMemo<string>(() => {
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = undefined;
    }

    if (!webpBuffer) return '';

    const blob = new Blob([webpBuffer as Uint8Array<ArrayBuffer>], { type: 'image/webp' });
    currentBlobUrl = URL.createObjectURL(blob);
    return currentBlobUrl;
  });

  onCleanup(() => {
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
    }
  });

  return blobUrl;
};
