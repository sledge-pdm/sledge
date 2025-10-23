import { FileLocation } from '@sledge/core';
import { platform } from '@tauri-apps/plugin-os';

export async function getFileUniqueId(path: string): Promise<string> {
  const buf = new TextEncoder().encode(path);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 16);
}

export const pathToFileLocation = (fullPath: string): FileLocation | undefined => {
  fullPath = fullPath.replace(/\//g, '\\'); // Normalize path format for Windows
  const filePath = fullPath.substring(0, fullPath.lastIndexOf('\\'));
  const fileName = fullPath.split('\\').pop()?.split('\\').pop();

  const rejoinedPath = normalizeJoin(...filePath.split('\\'));

  if (!filePath || !filePath?.trim() || !fileName || !fileName?.trim()) return undefined;
  else {
    return {
      path: rejoinedPath,
      name: fileName,
    };
  }
};

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

export const normalizePath = (path: string): string => {
  let replaced = path.trim().replace(/\\/g, '/').replace(/\/+/g, '/');
  if (!replaced.endsWith(':/') && replaced.endsWith('/')) replaced = replaced.slice(0, -1);
  return replaced;
};

export const normalizeJoin = (...paths: string[]): string => {
  const currentPlatform = platform();

  let joined;
  if (currentPlatform === 'windows') {
    joined = paths.join('\\');
  } else {
    joined = paths.join('/');
  }
  return normalizePath(joined);
};
