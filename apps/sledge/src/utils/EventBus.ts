import { Size2D, Vec2 } from '@sledge/core';
import mitt from 'mitt';
import { SelectionState } from '~/controllers/selection/SelectionManager';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';

export type Events = {
  'project:saved': { path: string };
  'project:saveFailed': { error: any };
  'project:saveCancelled': {};

  'canvas:sizeChanged': { newSize: Size2D };
  'canvas:onAdjusted': {};

  'layerHistory:changed': {};

  'selection:areaChanged': { commit: boolean };
  'selection:moved': { newOffset: Vec2 };
  'selection:stateChanged': { newState: SelectionState };

  'imagePool:entriesChanged': { newEntries: ImagePoolEntry[] };
  'imagePool:entryPropChanged': { id: string };

  'webgl:requestUpdate': { onlyDirty: boolean; context: string };

  'preview:requestUpdate': { layerId?: string };

  'window:sideSectionSideChanged': {};
};

export const eventBus = mitt<Events>();
