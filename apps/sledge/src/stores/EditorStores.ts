// editorStore.tsx
import { FileLocation } from '@sledge/core';
import { createStore } from 'solid-js/store';
import { ToolCategoryId, ToolPresets } from '~/features/tools/Tools';
import { AppearanceStore, defaultAppearanceStore } from '~/stores/editor/AppearanceStore';
import { ColorStore, defaultColorStore } from '~/stores/editor/ColorStore';
import { FileStore, defaultFileStore } from '~/stores/editor/FileStore';
import { InteractStore, defaultInteractStore } from '~/stores/editor/InteractStore';
import { LogStore, defaultLogStore } from '~/stores/editor/LogStore';
import { ToolStore, defaultToolStore } from '~/stores/editor/ToolStore';
import { LastSettingsStore, defaultLastSettingsStore } from '~/stores/global/LastSettingsStore';
import { eventBus } from '~/utils/EventBus';

export const initEditorStore = () => {
  const [appearanceStore, setAppearanceStore] = createStore<AppearanceStore>(defaultAppearanceStore);
  const [colorStore, setColorStore] = createStore<ColorStore>(defaultColorStore);
  const [fileStore, setFileStore] = createStore<FileStore>(defaultFileStore);
  const [interactStore, setInteractStore] = createStore<InteractStore>(defaultInteractStore);
  const [logStore, setLogStore] = createStore<LogStore>(defaultLogStore);
  const [toolStore, setToolStore] = createStore<ToolStore>(defaultToolStore);
  const [lastSettingsStore, setLastSettingsStore] = createStore<LastSettingsStore>(defaultLastSettingsStore);

  return {
    appearanceStore,
    setAppearanceStore,
    colorStore,
    setColorStore,
    fileStore,
    setFileStore,
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

export const fileStore = editorStore.fileStore;
export const setFileStore = editorStore.setFileStore;

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
  recentFiles: FileLocation[];
  presets: PresetRecord[];
}

export const getEditorStateStore = (): EditorStateStore => {
  return {
    appearanceStore: appearanceStore,
    colorStore: colorStore,
    lastSettingsStore: lastSettingsStore,
    recentFiles: fileStore.recentFiles,
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

export const loadEditorStateStore = (state: EditorStateStore) => {
  if (state.appearanceStore) setAppearanceStore(state.appearanceStore);
  if (state.lastSettingsStore) setLastSettingsStore(state.lastSettingsStore);
  if (state.colorStore) setColorStore(state.colorStore);
  setFileStore('recentFiles', state.recentFiles ?? []);
  state.presets?.forEach((record) => {
    setToolStore('tools', record.toolId, 'presets', record.presets);
    eventBus.emit('tools:presetLoaded', { toolId: record.toolId });
  });
};
