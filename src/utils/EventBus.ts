import mitt from 'mitt';
import { Size2D } from '~/models/types/Size';
import { Vec2 } from '~/models/types/Vector';

export type Events = {
  'canvas:sizeChanged': { newSize: Size2D };
  'canvas:onAdjusted': {};

  'layerHistory:changed': {};

  'selection:changed': { commit: boolean };
  'selection:moved': { newOffset: Vec2 };

  'webgl:requestUpdate': { onlyDirty: boolean };

  'preview:requestUpdate': { layerId?: string };
};

export const eventBus = mitt<Events>();
