import { FileLocation, Size2D } from '@sledge-pdm/core';
import mitt from 'mitt';

export type Events = {
  'project:saved': { location: FileLocation };
  'project:saveFailed': { error: any };
  'project:saveCancelled': {};

  'canvas:layoutReady': { newSize: Size2D };

  'selection:updateSelectionPath': { immediate?: boolean };
  'selection:updateLassoOutline': {};
  'selection:updateSelectionMenu': { immediate?: boolean };

  'tools:presetLoaded': { toolId?: string };

  'webgl:requestUpdate': { context: string };
  'webgl:requestResume': {};
  'webgl:renderPaused': {};

  'window:sideSectionSideChanged': {};

  'export:requestExportPath': { newPath: string };
};

export const eventBus = mitt<Events>();
