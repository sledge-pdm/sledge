export const importableFileExtensions = ['png', 'jpeg', 'jpg', 'webp'] as const;
export type ImportableFileExtensions = (typeof importableFileExtensions)[number];

export const exportableFileTypes = ['png', 'jpeg', 'webp_lossy', 'webp_lossless', 'svg'] as const;
export type ExportableFileTypes = (typeof exportableFileTypes)[number];

export const openableFileExtensions = ['sledge', ...importableFileExtensions] as const;
export type OpenableFileExtensions = (typeof openableFileExtensions)[number];

export function convertToLabel(extType: string): string | undefined {
  if (extType === 'png') return 'png';
  if (extType === 'jpeg') return 'jpeg';
  if (extType === 'jpg') return 'jpeg';
  if (extType === 'webp_lossy') return 'webp (lossy)';
  if (extType === 'webp_lossless') return 'webp (lossless)';
  if (extType === 'svg') return 'svg';

  return undefined;
}
export function convertToExtension(extType: string): string | undefined {
  if (extType === 'png') return 'png';
  if (extType === 'jpeg' || extType === 'jpg') return 'jpg';
  if (extType === 'webp_lossy' || extType === 'webp_lossless') return 'webp';
  if (extType === 'svg') return 'svg';

  return undefined;
}
export function convertToMimetype(extType: string): string | undefined {
  if (extType === 'png') return 'image/png';
  if (extType === 'jpeg' || extType === 'jpg') return 'image/jpeg';
  if (extType === 'webp_lossy' || extType === 'webp_lossless') return 'image/webp ';

  return undefined;
}
