import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyProjectLocation,
  applyProjectLocationFromPath,
  getActiveProjectLocation,
  hasActiveProjectLocation,
} from '~/features/io/project/ProjectLocationManager';
import { ioStore, setIOStore } from '~/stores/EditorStores';
import { setProjectStore } from '~/stores/RuntimeProjectStore';

describe('ProjectLocationManager', () => {
  beforeEach(() => {
    setIOStore('savedLocation', { path: undefined, name: undefined });
    setIOStore('openAs', 'new_project');
    setProjectStore('project', 'lastSavedPath', undefined);
  });

  it('applyProjectLocation sets saved location and lastSavedPath for project mode', () => {
    applyProjectLocation({ path: 'C:/work', name: 'sample.sledge' }, 'project');

    expect(getActiveProjectLocation()).toEqual({ path: 'C:/work', name: 'sample.sledge' });
    expect(ioStore.openAs).toBe('project');
    expect(hasActiveProjectLocation()).toBe(true);
  });

  it('applyProjectLocation clears lastSavedPath for non-project modes', () => {
    applyProjectLocation({ path: 'C:/work', name: 'sample.png' }, 'image');

    expect(ioStore.openAs).toBe('image');
    expect(hasActiveProjectLocation()).toBe(true);
  });

  it('applyProjectLocation with undefined clears active location', () => {
    applyProjectLocation(undefined, 'new_project');
    expect(getActiveProjectLocation()).toEqual({ path: undefined, name: undefined });
    expect(hasActiveProjectLocation()).toBe(false);
  });

  it('applyProjectLocationFromPath parses path and applies project mode', () => {
    const parsed = applyProjectLocationFromPath('C:\\Users\\foo\\bar\\demo.sledge', 'project');

    expect(parsed).toEqual({
      path: 'C:/Users/foo/bar',
      name: 'demo.sledge',
    });
    expect(ioStore.savedLocation).toEqual(parsed);
    expect(ioStore.openAs).toBe('project');
  });

  it('applyProjectLocationFromPath returns undefined for invalid path', () => {
    const parsed = applyProjectLocationFromPath('invalid', 'project');
    expect(parsed).toBeUndefined();
  });
});
