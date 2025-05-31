import mitt from 'mitt';
import { Size2D } from '~/types/Size';

export type Events = {
  'canvas:sizeChanged': { newSize: Size2D };
  'webgl:requestUpdate': { onlyDirty: boolean };
  'preview:requestUpdate': { layerId?: string };
};

export const eventBus = mitt<Events>();
