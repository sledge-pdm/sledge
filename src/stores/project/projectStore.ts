import { trackStore } from '@solid-primitives/deep';
import { createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';
import { canvasStore } from './canvasStore';
import { layerImageStore } from './layerImageStore';
import { layerStore } from './layerStore';

// project
export const [projectStore, setProjectStore] = createStore({
  newName: undefined as string | undefined,
  name: undefined as string | undefined,
  path: undefined as string | undefined,
  isProjectChangedAfterSave: false,
});

createEffect(() => {
  trackStore(canvasStore.canvas);
  trackStore(layerImageStore);
  trackStore(layerStore);
  setProjectStore('isProjectChangedAfterSave', true);
});
