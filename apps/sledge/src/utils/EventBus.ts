import { Size2D, Vec2 } from '@sledge/core';
import mitt from 'mitt';

export type Events = {
  'canvas:sizeChanged': { newSize: Size2D };
  'canvas:onAdjusted': {};

  'layerHistory:changed': {};

  'selection:changed': { commit: boolean };
  'selection:moved': { newOffset: Vec2 };

  'webgl:requestUpdate': { onlyDirty: boolean };

  'preview:requestUpdate': { layerId?: string };

  'window:sideSectionSideChanged': {};
};

export const eventBus = mitt<Events>();
