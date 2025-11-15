import { FileLocation } from '@sledge/core';
import { homeDir, pictureDir } from '@tauri-apps/api/path';
import { exists, mkdir } from '@tauri-apps/plugin-fs';
import { platform } from '@tauri-apps/plugin-os';
import { importableFileExtensions, openableFileExtensions } from '~/features/io/FileExtensions';
import { fileStore } from '~/stores/EditorStores';
import { safeInvoke } from '~/utils/TauriUtils';

export async function getFileUniqueId(path: string): Promise<string> {
  const buf = new TextEncoder().encode(path);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 16);
}

export const pathToFileLocation = (fullPath: string): FileLocation | undefined => {
  if (!fullPath || !fullPath.trim()) return undefined;
  const normalized = normalizePath(fullPath);
  const sepIndex = normalized.lastIndexOf('/');
  if (sepIndex <= 0 || sepIndex === normalized.length - 1) return undefined;
  const dir = normalized.substring(0, sepIndex);
  const name = normalized.substring(sepIndex + 1);
  if (!dir.trim() || !name.trim()) return undefined;
  return {
    path: dir,
    name,
  };
};

export async function defaultProjectDir() {
  const pf = platform();
  if (pf === 'linux') {
    const home = await homeDir();
    const linuxPicDir = normalizeJoin(home, 'sledge');
    if (!(await exists(linuxPicDir))) await mkdir(linuxPicDir, { recursive: true });
    return linuxPicDir;
  } else {
    return await pictureDir();
  }
}

export async function defaultPictureDir() {
  const home = await homeDir();
  const projectDir = normalizeJoin(home, 'sledge');
  if (!(await exists(projectDir)))
    await mkdir(projectDir, {
      recursive: true,
    });
  return projectDir;
}

export async function projectSaveDir(): Promise<string> {
  if (fileStore.savedLocation.path) {
    return normalizePath(fileStore.savedLocation.path);
  }
  return await defaultProjectDir();
}

export async function exportDir(): Promise<string> {
  if (fileStore.savedLocation.path) {
    return normalizePath(fileStore.savedLocation.path);
  }
  return await defaultPictureDir();
}

export const getFileNameWithoutExtension = (fileName?: string): string => {
  if (!fileName) return '';
  return fileName.replace(/\.[^/.]+$/, '');
};

/**
 * @deprecated use normalizedJoin.
 */
export const join = (...paths: string[]): string => {
  const currentPlatform = platform();

  if (currentPlatform === 'windows') {
    return paths.join('\\');
  } else {
    return paths.join('/');
  }
};

const isUncPath = (value: string): boolean => {
  if (!value) return false;
  const startsUnc = value.startsWith('\\\\') || value.startsWith('//');
  const hasBackslash = value.includes('\\');
  if (!startsUnc || !hasBackslash) return false;
  const withoutPrefix = value.replace(/^[/\\]+/, '');
  const parts = withoutPrefix.split(/[/\\]/).filter((part) => part.length > 0);
  return parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0;
};

export const normalizePath = (path: string): string => {
  let trimmed = path.trim();
  if (!trimmed) return '';

  const isUnc = isUncPath(trimmed);
  if (isUnc) trimmed = trimmed.replace(/^[/\\]+/, '');

  let replaced = trimmed.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  if (isUnc) replaced = '//' + replaced;
  if (!replaced.endsWith(':/') && replaced.endsWith('/')) replaced = replaced.slice(0, -1);
  return replaced;
};

export const normalizeJoin = (...paths: string[]): string => {
  if (!paths || paths.length === 0) return '';
  const pieces: string[] = [];
  let hasUnixRoot = false;
  paths.forEach((segment) => {
    if (!segment || !segment.trim()) return;
    let cleaned = segment.replace(/\\/g, '/').trim();
    if (!cleaned) return;

    if (!hasUnixRoot && /^\/+$/.test(cleaned)) {
      hasUnixRoot = true;
      return;
    }

    const isFirstPiece = pieces.length === 0;
    if (isFirstPiece) {
      cleaned = cleaned.replace(/\/+$/, '');
    } else {
      cleaned = cleaned.replace(/^\/+/, '').replace(/\/+$/, '');
    }
    if (cleaned) pieces.push(cleaned);
  });

  if (pieces.length === 0) return hasUnixRoot ? '/' : '';
  const currentPlatform = platform();
  let joined = currentPlatform === 'windows' ? pieces.join('\\') : pieces.join('/');
  if (hasUnixRoot && joined) {
    joined = '/' + joined.replace(/^\/+/, '');
  }
  const normalized = normalizePath(joined);
  if (hasUnixRoot && !normalized) return '/';
  return normalized;
};

export const formatNativePath = (path: string): string => {
  const original = path.trim();
  const normalized = normalizePath(path);
  if (!normalized) return '';

  const currentPlatform = platform();
  if (currentPlatform !== 'windows') return normalized;

  if (normalized.startsWith('//?/')) {
    return normalized.replace(/\//g, '\\');
  }

  const looksLikeUnc = original.startsWith('\\\\') || original.startsWith('//') || normalized.startsWith('//');

  if (looksLikeUnc) {
    const withoutPrefix = normalized.replace(/^\/+/, '');
    return `\\\\${withoutPrefix.replace(/\//g, '\\')}`;
  }

  if (/^[a-zA-Z]:\//.test(normalized)) {
    return normalized.replace(/\//g, '\\');
  }

  return normalized.replace(/\//g, '\\');
};

export const getAvailableDriveLetters = async (): Promise<string[] | undefined> => {
  const platformType = platform();
  if (platformType !== 'windows') {
    // console.warn('getAvailableDriveLetters is only available on Windows platform.');
    return undefined;
  }

  return await safeInvoke('get_available_drive_letters');
};

export const getDefinedDriveLetters = async (): Promise<string[] | undefined> => {
  const platformType = platform();
  if (platformType !== 'windows') {
    // console.warn('getAvailableDriveLetters is only available on Windows platform.');
    return undefined;
  }

  return await safeInvoke('get_defined_drive_letters');
};

export const isOpenableFile = (name: string) => {
  if (!name.includes('.')) return false;
  return openableFileExtensions.some((ext) => name.endsWith(`.${ext}`));
};

export const isImportableFile = (name: string) => {
  if (!name.includes('.')) return false;
  return importableFileExtensions.some((ext) => name.endsWith(`.${ext}`));
};
