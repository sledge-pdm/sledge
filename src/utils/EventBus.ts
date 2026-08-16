import { FileLocation, Size2D } from '@sledge-pdm/core';
import mitt from 'mitt';

/** @description the four stretches of a save, in the order they run. */
export type SaveProgressPhase = 'layers' | 'history' | 'pack' | 'write';

export type Events = {
  'project:saved': { location: FileLocation };
  'project:saveFailed': { error: any };
  'project:saveCancelled': {};
  /** @description how far a running save has got. `done`/`total` count within the current phase only. */
  'project:saveProgress': { phase: SaveProgressPhase; done: number; total: number };

  'canvas:layoutReady': { newSize: Size2D };

  'selection:updateLassoOutline': {};

  'tools:presetLoaded': { toolId?: string };

  'webgl:requestUpdate': { context: string };
  'webgl:requestResume': {};
  'webgl:renderPaused': {};

  'window:sideSectionSideChanged': {};

  'export:requestExportPath': { newPath: string };
};

export const eventBus = mitt<Events>();
