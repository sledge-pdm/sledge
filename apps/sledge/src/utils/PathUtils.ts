import { FileLocation } from '@sledge/core';

export const PathToFileLocation = (fullPath: string): FileLocation | undefined => {
  fullPath = fullPath.replace(/\//g, '\\'); // Normalize path format for Windows
  const filePath = fullPath.substring(0, fullPath.lastIndexOf('\\'));
  const fileName = fullPath.split('\\').pop()?.split('\\').pop();

  if (filePath === undefined || fileName === undefined) return undefined;
  else {
    return {
      path: filePath,
      name: fileName,
    };
  }
};
