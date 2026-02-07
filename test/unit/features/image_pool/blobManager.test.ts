import { gzipDeflate } from '@sledge-pdm/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearImagePoolBlobUrls, getImagePoolBlobUrl, removeImagePoolBlobUrl } from '~/features/image_pool/blobManager';
import { setImagePoolImage, setImagePoolImages } from '~/features/image_pool/imageStore';

describe('image_pool blobManager', () => {
  beforeEach(() => {
    clearImagePoolBlobUrls();
    setImagePoolImages(new Map());
  });

  it('caches blob url per entry and reuses existing value', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:cached');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    try {
      setImagePoolImage('e1', {
        mimeType: 'image/png',
        deflatedBuffer: gzipDeflate(new Uint8Array([1, 2, 3])),
      });

      const first = getImagePoolBlobUrl('e1');
      const second = getImagePoolBlobUrl('e1');

      expect(first).toBe('blob:cached');
      expect(second).toBe('blob:cached');
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).not.toHaveBeenCalled();
    } finally {
      createObjectURL.mockRestore();
      revokeObjectURL.mockRestore();
    }
  });

  it('removeImagePoolBlobUrl revokes existing url and allows regeneration', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    try {
      setImagePoolImage('e1', {
        mimeType: 'image/png',
        deflatedBuffer: gzipDeflate(new Uint8Array([7, 8, 9])),
      });
      const first = getImagePoolBlobUrl('e1');
      removeImagePoolBlobUrl('e1');
      const second = getImagePoolBlobUrl('e1');

      expect(first).toBe('blob:first');
      expect(second).toBe('blob:second');
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:first');
    } finally {
      createObjectURL.mockRestore();
      revokeObjectURL.mockRestore();
    }
  });

  it('clearImagePoolBlobUrls revokes all cached urls', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:a').mockReturnValueOnce('blob:b');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    try {
      setImagePoolImage('e1', {
        mimeType: 'image/png',
        deflatedBuffer: gzipDeflate(new Uint8Array([1])),
      });
      setImagePoolImage('e2', {
        mimeType: 'image/png',
        deflatedBuffer: gzipDeflate(new Uint8Array([2])),
      });
      getImagePoolBlobUrl('e1');
      getImagePoolBlobUrl('e2');

      clearImagePoolBlobUrls();

      expect(revokeObjectURL).toHaveBeenCalledWith('blob:a');
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:b');
    } finally {
      createObjectURL.mockRestore();
      revokeObjectURL.mockRestore();
    }
  });
});
