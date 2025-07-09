import { FileLocation } from '@sledge/core';

export interface FileItemProps {
  thumbnail: string;
  onClick: (file: FileLocation) => void;
  file: FileLocation;
}
