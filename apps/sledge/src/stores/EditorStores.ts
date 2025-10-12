// editorStore.tsx
import { createStore } from 'solid-js/store';
import { AppearanceStore, defaultAppearanceStore } from '~/stores/editor/AppearanceStore';
import { ColorStore, defaultColorStore } from '~/stores/editor/ColorStore';
import { FileStore, defaultFileStore } from '~/stores/editor/FileStore';
import { InteractStore, defaultInteractStore } from '~/stores/editor/InteractStore';
import { LogStore, defaultLogStore } from '~/stores/editor/LogStore';
import { ToolStore, defaultToolStore } from '~/stores/editor/ToolStore';

export const initEditorStore = () => {
  const [appearanceStore, setAppearanceStore] = createStore<AppearanceStore>(defaultAppearanceStore);
  const [colorStore, setColorStore] = createStore<ColorStore>(defaultColorStore);
  const [fileStore, setFileStore] = createStore<FileStore>(defaultFileStore);
  const [interactStore, setInteractStore] = createStore<InteractStore>(defaultInteractStore);
  const [logStore, setLogStore] = createStore<LogStore>(defaultLogStore);
  const [toolStore, setToolStore] = createStore<ToolStore>(defaultToolStore);

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
