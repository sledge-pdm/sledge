export type ImagePoolEntry = {
  id: string;
  imagePath: string; // original image file path

  base: { width: number; height: number };
  transform: { x: number; y: number; scaleX: number; scaleY: number };

  opacity: number;
  visible: boolean;
};
