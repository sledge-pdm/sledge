import { describe, expect, it } from 'vitest';
import { getFileExtensionInfo, OPENABLE_FILE_EXTENSIONS } from '~/features/io/Extensions';
import { EXPORT_TYPES } from '~/features/io/export/types';

describe('Extensions', () => {
  it('maps known export types to labels', () => {
    expect(EXPORT_TYPES.webp_lossy.label).toBe('webp (lossy)');
    expect(EXPORT_TYPES.jpeg.label).toBe('jpeg');
  });

  it('maps known export types to extensions', () => {
    expect(EXPORT_TYPES.jpeg.fileExtension).toBe('jpeg');
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

  it('get extension info', () => {
    const pngInfo = getFileExtensionInfo('/some/path/to/image.png');
    expect(pngInfo?.image).toBeTruthy();
    expect(pngInfo?.importable).toBeTruthy();
    expect(pngInfo?.exportable).toBeTruthy();
    const svgInfo = getFileExtensionInfo('/some/path/to/path.svg');
    expect(svgInfo?.image).toBeTruthy();
    expect(svgInfo?.importable).toBeFalsy();
    expect(svgInfo?.exportable).toBeTruthy();
  });
});
