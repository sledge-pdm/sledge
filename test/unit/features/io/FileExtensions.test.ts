import { describe, expect, it } from 'vitest';
import { OPENABLE_FILE_EXTENSIONS } from '~/features/io/Extensions';
import { EXPORT_TYPES } from '~/features/io/export/types';

describe('Extensions', () => {
  it('maps known export types to labels', () => {
    expect(EXPORT_TYPES.webp_lossy.label).toBe('webp (lossy)');
    expect(EXPORT_TYPES.jpeg.label).toBe('jpeg');
  });

  it('maps known export types to extensions', () => {
    expect(EXPORT_TYPES.jpeg.fileExtension).toBe('jpg');
    expect(EXPORT_TYPES.webp_lossless.fileExtension).toBe('webp');
    expect(EXPORT_TYPES.svg.fileExtension).toBe('svg');
  });

  it('maps known export types to mimetypes', () => {
    expect(EXPORT_TYPES.png.mimeType).toBe('image/png');
    expect(EXPORT_TYPES.jpeg.mimeType).toBe('image/jpeg');
  });

  it('keeps openable extensions list stable', () => {
    expect(OPENABLE_FILE_EXTENSIONS).toContain('sledge');
  });
});
