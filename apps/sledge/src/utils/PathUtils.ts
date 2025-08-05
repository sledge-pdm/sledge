import { FileLocation } from '@sledge/core';
import { platform } from '@tauri-apps/plugin-os';

export const PathToFileLocation = (fullPath: string): FileLocation | undefined => {
  fullPath = fullPath.replace(/\//g, '\\'); // Normalize path format for Windows
  const filePath = fullPath.substring(0, fullPath.lastIndexOf('\\'));
  const fileName = fullPath.split('\\').pop()?.split('\\').pop();

  const rejoinedPath = join(...filePath.split('\\'));

  if (filePath === undefined || fileName === undefined) return undefined;
  else {
    return {
      path: rejoinedPath,
      name: fileName,
    };
  }
};

export const join = (...paths: string[]): string => {
  const currentPlatform = platform();

  // platform returns a string describing the specific operating system in use.
  // The value is set at compile time.
  // Possible values are linux, macos, ios, freebsd, dragonfly, netbsd, openbsd, solaris, android, windows.

  // https://v2.tauri.app/ja/plugin/os-info/

  if (currentPlatform === 'windows') {
    return paths.join('\\');
  } else {
    return paths.join('/');
  }
};
