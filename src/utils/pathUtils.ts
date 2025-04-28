import { FileLocation } from '~/types/FileLocation';

export const getFileNameAndPath = (fullPath: string): FileLocation | undefined => {
  const filePath = fullPath.substring(0, fullPath.lastIndexOf('\\'));
  const fileName = fullPath.split('\\').pop()?.split('/').pop();

  if (filePath === undefined || fileName === undefined) return undefined;
  else {
    return {
      path: filePath,
      name: fileName,
    };
  }
};
