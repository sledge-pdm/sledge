import { Accessor, createMemo } from 'solid-js';
import { ImagePoolImage } from './model';

export const useImageBlobUrl = (getImage: Accessor<ImagePoolImage | undefined>) => createMemo<string>(() => getImage()?.blobUrl ?? '');
