import { describe, expect, it } from 'vitest';
import { convertToExtension, convertToLabel, convertToMimetype, openableFileExtensions } from '~/features/io/FileExtensions';

describe('FileExtensions', () => {
  it('maps known types to labels', () => {
    expect(convertToLabel('webp_lossy')).toBe('webp (lossy)');
    expect(convertToLabel('jpg')).toBe('jpeg');
  });

  it('maps known types to extensions', () => {
    expect(convertToExtension('jpeg')).toBe('jpg');
    expect(convertToExtension('webp_lossless')).toBe('webp');
  });

  it('maps known types to mimetypes', () => {
    expect(convertToMimetype('png')).toBe('image/png');
    expect(convertToMimetype('jpg')).toBe('image/jpeg');
  });

  it('keeps openable extensions list stable', () => {
    expect(openableFileExtensions).toContain('sledge');
  });
});
