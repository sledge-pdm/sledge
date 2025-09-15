import { FileLocation, Size2D, Vec2 } from '@sledge/core';
import mitt from 'mitt';
import { ImagePoolEntry } from '~/features/image_pool';
import { SelectionState } from '~/features/selection/SelectionAreaManager';

export type Events = {
  'project:saved': { location: FileLocation };
  'project:saveFailed': { error: any };
  'project:saveCancelled': {};

  'canvas:sizeChanged': { newSize: Size2D };
  'canvas:onAdjusted': {};
  'canvas:onZoomChanged': {};

  'selection:maskChanged': { commit: boolean };
  'selection:offsetChanged': { newOffset: Vec2 };
  'selection:stateChanged': { newState: SelectionState };
  'selection:requestMenuUpdate': {};

  'floatingMove:stateChanged': { moving: boolean };
  'floatingMove:moved': {};
  'floatingMove:committed': {};

  'imagePool:entriesChanged': { newEntries: ImagePoolEntry[] };
  'imagePool:entryPropChanged': { id: string };

  'webgl:requestUpdate': { onlyDirty: boolean; context: string };

  'preview:requestUpdate': { layerId?: string };

  'window:sideSectionSideChanged': {};
};

export const eventBus = mitt<Events>();
