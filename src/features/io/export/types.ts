import { FileExtension } from '../Extensions';

export interface ExportType {
  label: string;
  fileExtension: FileExtension;
  mimeType?: string;
  qualityMutable?: boolean;
}

export type ExportableTypes = 'png' | 'jpeg' | 'webp_lossy' | 'webp_lossless' | 'svg';

const MIME_TYPE_PNG = 'image/png';
const MIME_TYPE_JPEG = 'image/jpeg';
const MIME_TYPE_WEBP = 'image/webp';
const MIME_TYPE_SVG = 'image/svg+xml';

export const EXPORT_TYPES: Record<ExportableTypes, ExportType> = {
  png: { label: 'png', fileExtension: 'png', mimeType: MIME_TYPE_PNG },
  jpeg: { label: 'jpeg', fileExtension: 'jpeg', mimeType: MIME_TYPE_JPEG, qualityMutable: true },
  webp_lossy: { label: 'webp (lossy)', fileExtension: 'webp', mimeType: MIME_TYPE_WEBP, qualityMutable: true },
  webp_lossless: { label: 'webp (lossless)', fileExtension: 'webp', mimeType: MIME_TYPE_WEBP },
  svg: { label: 'svg', fileExtension: 'svg', mimeType: MIME_TYPE_SVG },
} as const;

export function getExportType(type: ExportableTypes): ExportType {
  return EXPORT_TYPES[type];
}
