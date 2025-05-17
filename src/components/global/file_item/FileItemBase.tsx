import { FileLocation } from '~/types/FileLocation';

export interface FileItemProps {
  thumbnail: string;
  onClick: (file: FileLocation) => void;
  file: FileLocation;
}
