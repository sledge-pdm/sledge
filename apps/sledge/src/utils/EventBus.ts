import { FileLocation, Size2D } from '@sledge/core';
import mitt from 'mitt';
import { ImagePoolEntry } from '~/features/image_pool';

export type Events = {
  'project:saved': { location: FileLocation };
  'project:saveFailed': { error: any };
  'project:saveCancelled': {};

  'canvas:sizeChanged': { newSize: Size2D };

  'selection:updateSelectionPath': { immediate?: boolean };
  'selection:updateLassoOutline': {};
  'selection:updateSelectionMenu': { immediate?: boolean };

  'tools:presetLoaded': { toolId?: string };

  'imagePool:entriesChanged': { newEntries: ImagePoolEntry[] };
  'imagePool:entryPropChanged': { id: string };

  'webgl:requestUpdate': { onlyDirty: boolean; context: string };
  'webgl:requestResume': {};
  'webgl:renderPaused': {};

  'preview:requestUpdate': { layerId?: string };

  'window:sideSectionSideChanged': {};

  'clipboard:doCopy': {};
  'clipboard:doCut': {};
  'clipboard:doPaste': {};
};

export const eventBus = mitt<Events>();
