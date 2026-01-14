import { Size2D } from '@sledge-pdm/core';
import mitt from 'mitt';
import { FileLocation } from '~/types/FileLocation';

export type Events = {
  'project:saved': { location: FileLocation };
  'project:saveFailed': { error: any };
  'project:saveCancelled': {};

  'canvas:sizeChanged': { newSize: Size2D };
  'canvas:layoutReady': { newSize: Size2D };

  'selection:updateSelectionPath': { immediate?: boolean };
  'selection:updateLassoOutline': {};
  'selection:updateSelectionMenu': { immediate?: boolean };

  'tools:presetLoaded': { toolId?: string };

  'webgl:requestUpdate': { context: string };
  'webgl:requestResume': {};
  'webgl:renderPaused': {};

  'preview:requestUpdate': { layerId?: string };

  'window:sideSectionSideChanged': {};

  'clipboard:doCopy': {};
  'clipboard:doCut': {};
  'clipboard:doPaste': {};

  'export:requestExportPath': { newPath: string };
};

export const eventBus = mitt<Events>();
