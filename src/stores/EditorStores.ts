// editorStore.tsx
import { FileLocation } from '@sledge-pdm/core';
import { createStore } from 'solid-js/store';
import { ToolCategoryId, ToolPresets } from '~/features/tools/Tools';
import { AppearanceStore, createDefaultAppearanceStore, sanitizeAppearanceStore } from '~/stores/editor/AppearanceStore';
import { ColorStore, defaultColorStore } from '~/stores/editor/ColorStore';
import { IOStore, defaultIOStore } from '~/stores/editor/IOStore';
import { InteractStore, defaultInteractStore } from '~/stores/editor/InteractStore';
import { LogStore, defaultLogStore } from '~/stores/editor/LogStore';
import { ToolStore, defaultToolStore } from '~/stores/editor/ToolStore';
import { LastSettingsStore, defaultLastSettingsStore } from '~/stores/global/LastSettingsStore';
import { eventBus } from '~/utils/EventBus';

export const initEditorStore = () => {
  const [appearanceStore, setAppearanceStore] = createStore<AppearanceStore>(createDefaultAppearanceStore());
  const [colorStore, setColorStore] = createStore<ColorStore>(defaultColorStore);
  const [ioStore, setIOStore] = createStore<IOStore>(defaultIOStore);
  const [interactStore, setInteractStore] = createStore<InteractStore>(defaultInteractStore);
  const [logStore, setLogStore] = createStore<LogStore>(defaultLogStore);
  const [toolStore, setToolStore] = createStore<ToolStore>(defaultToolStore);
  const [lastSettingsStore, setLastSettingsStore] = createStore<LastSettingsStore>(defaultLastSettingsStore);

  return {
    appearanceStore,
    setAppearanceStore,
    colorStore,
    setColorStore,
    ioStore,
    setIOStore,
    interactStore,
    setInteractStore,
    logStore,
    setLogStore,
    toolStore,
    setToolStore,
    lastSettingsStore,
    setLastSettingsStore,
  };
};

const editorStore = initEditorStore();

export const appearanceStore = editorStore.appearanceStore;
export const setAppearanceStore = editorStore.setAppearanceStore;

export const colorStore = editorStore.colorStore;
export const setColorStore = editorStore.setColorStore;

export const ioStore = editorStore.ioStore;
export const setIOStore = editorStore.setIOStore;

export const interactStore = editorStore.interactStore;
export const setInteractStore = editorStore.setInteractStore;

export const logStore = editorStore.logStore;
export const setLogStore = editorStore.setLogStore;

export const toolStore = editorStore.toolStore;
export const setToolStore = editorStore.setToolStore;

export const lastSettingsStore = editorStore.lastSettingsStore;
export const setLastSettingsStore = editorStore.setLastSettingsStore;

interface PresetRecord {
  toolId: ToolCategoryId;
  presets: ToolPresets;
}

// Static global state of editor to be stored in appdir.
// Include values so that removing it will not affect any behavior of editor.
// (Also note that this doesn't include any config-related things.)
export interface EditorStateStore {
  appearanceStore: AppearanceStore;
  colorStore: ColorStore;
  lastSettingsStore: LastSettingsStore;
  lastOpenAs: 'project' | 'new_project' | 'image';
  lastPath: FileLocation;
  recentFiles: FileLocation[];
  presets: PresetRecord[];
}

export const getEditorStateStore = (): EditorStateStore => {
  return {
    appearanceStore: appearanceStore,
    colorStore: colorStore,
    lastSettingsStore: lastSettingsStore,
    lastOpenAs: ioStore.openAs,
    lastPath: ioStore.savedLocation,
    recentFiles: ioStore.recentFiles,
    presets: Object.values(toolStore.tools)
      .map((tool) => {
        if (!tool.presets) return null;
        return {
          toolId: tool.id,
          presets: tool.presets,
        };
      })
      .filter((preset): preset is PresetRecord => preset !== null),
  };
};

export const loadEditorStateStore = (
  state: EditorStateStore
): {
  lastOpenAs?: 'project' | 'new_project' | 'image';
  lastPath?: FileLocation;
} => {
  console.log(state.appearanceStore);
  if (state.appearanceStore) setAppearanceStore(sanitizeAppearanceStore(state.appearanceStore));
  if (state.lastSettingsStore) setLastSettingsStore(state.lastSettingsStore);
  if (state.colorStore) setColorStore(state.colorStore);

  setIOStore('recentFiles', state.recentFiles ?? []);
  state.presets?.forEach((record) => {
    setToolStore('tools', record.toolId, 'presets', record.presets);
    eventBus.emit('tools:presetLoaded', { toolId: record.toolId });
  });

  // init explorer path on load
  setAppearanceStore('explorerPath', undefined);

  return {
    lastOpenAs: state.lastOpenAs,
    lastPath: state.lastPath,
  };
};
