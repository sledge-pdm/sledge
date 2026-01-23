import { FileLocation } from '@sledge-pdm/core';

export type FileExtension = 'sledge' | 'png' | 'jpg' | 'jpeg' | 'webp' | 'svg';

export interface ExtensionInfo {
  ext: FileExtension; // .{ext} | in lowercase | preferred as export extension
  project?: boolean;
  image?: boolean;
  importable: boolean;
  exportable: boolean; // if true, it's exportable as image
  description: string;
}

export const FILE_EXTENSIONS = {
  sledge: {
    ext: 'sledge',
    project: true,
    importable: false,
    exportable: false,
    description: 'Sledge project',
  },
  png: {
    ext: 'png',
    image: true,
    importable: true,
    exportable: true,
    description: 'PNG image',
  },
  jpg: {
    ext: 'jpg',
    image: true,
    importable: true,
    exportable: true,
    description: 'JPEG image',
  },
  jpeg: {
    ext: 'jpeg',
    image: true,
    importable: true,
    exportable: true,
    description: 'JPEG image',
  },
  webp: {
    ext: 'webp',
    image: true,
    importable: true,
    exportable: true,
    description: 'WEBP image',
  },
  svg: {
    ext: 'svg',
    image: true,
    importable: false,
    exportable: true,
    description: 'SVG path file',
  },
} as const satisfies Record<FileExtension, ExtensionInfo>;

const extensionValues: ExtensionInfo[] = Object.values(FILE_EXTENSIONS);

export const IMPORTABLE_FILE_EXTENSIONS: FileExtension[] = extensionValues.filter((info) => info.importable).map((info) => info.ext);
export const OPENABLE_FILE_EXTENSIONS: FileExtension[] = extensionValues.filter((info) => info.project || info.importable).map((info) => info.ext);

function isFileExtension(value: string): value is FileExtension {
  return value in FILE_EXTENSIONS;
}

function getNormalizedExtension(path: string): string | undefined {
  const trimmed = path?.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(/\\/g, '/');
  const name = normalized.split('/').pop();
  if (!name) return undefined;
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === name.length - 1) return undefined;
  return name.slice(dotIndex + 1).toLowerCase();
}

export function getFileExtensionInfo(pathOrLocation: string | FileLocation): ExtensionInfo | undefined {
  const fullPath = typeof pathOrLocation === 'string' ? pathOrLocation : pathOrLocation.name;
  if (!fullPath) return undefined;
  const ext = getNormalizedExtension(fullPath);
  if (!ext || !isFileExtension(ext)) return undefined;
  return FILE_EXTENSIONS[ext];
}

export function isSledgeProjectFile(pathOrLocation: string | FileLocation): boolean {
  const info = getFileExtensionInfo(pathOrLocation);
  return info?.project ?? false;
}

export function isImageFile(pathOrLocation: string | FileLocation): boolean {
  const info = getFileExtensionInfo(pathOrLocation);
  return info?.image ?? false;
}

export function isImportableFile(pathOrLocation: string | FileLocation): boolean {
  const info = getFileExtensionInfo(pathOrLocation);
  return info?.importable ?? false;
}

export function isOpenableFile(pathOrLocation: string | FileLocation): boolean {
  const info = getFileExtensionInfo(pathOrLocation);
  return (info?.project ?? false) || (info?.importable ?? false);
}
