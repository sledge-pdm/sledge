import { Accessor, createMemo } from 'solid-js';
import { getImagePoolBlobUrl } from './blobManager';

export const useImageBlobUrl = (getEntryId: Accessor<string | undefined>) =>
  createMemo<string>(() => {
    const entryId = getEntryId();
    if (!entryId) return '';
    return getImagePoolBlobUrl(entryId) ?? '';
  });
