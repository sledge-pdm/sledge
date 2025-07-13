// editorStore.tsx
import { Size2D, Vec2 } from '@sledge/core';
import { createStore } from 'solid-js/store';
import { PaletteType } from '~/models/color/PaletteType';
import { defaultTools, Tool, ToolType } from '~/tools/Tools';

type SideAppearanceMode = 'editor' | 'project';
type AppearanceStore = {
  leftSide: {
    shown: boolean;
    selected: SideAppearanceMode;
  };
  rightSide: {
    shown: boolean;
    selected: SideAppearanceMode;
  };
};
type ColorStore = {
  currentPalette: PaletteType;
  primary: string;
  secondary: string;
  swatches: string[];
};
type InteractStore = {
  canvasAreaSize: Size2D;
  lastMouseWindow: Vec2;
  lastMouseOnCanvas: Vec2;
  isMouseOnCanvas: boolean;
  isInStroke: boolean;
  zoom: number;
  zoomMin: number;
  zoomMax: number;
  touchZoomSensitivity: number;
  wheelZoomStep: number;
  offsetOrigin: Vec2;
  offset: Vec2;
  isDragging: boolean;
};
type LogStore = {
  bottomBarText: string;
};
export type ToolStore = {
  tools: { [toolType: string]: Tool };
  activeType: ToolType;
  prevActiveType: ToolType | undefined;
};

const defaultAppearanceStore: AppearanceStore = {
  leftSide: {
    shown: true,
    selected: 'editor' as SideAppearanceMode,
  },
  rightSide: {
    shown: true,
    selected: 'editor' as SideAppearanceMode,
  },
};
const defaultColorStore: ColorStore = {
  currentPalette: 'primary' as PaletteType,
  primary: '#000000', // 通常の描画色
  secondary: '#ffffff', // 背景・消しゴムなど
  swatches: ['#000000', '#FFFFFF', '#ffff00', '#00ffff', '#00ff00', '#ff00ff', '#ff0000', '#0000ff', '#000080', '#400080'],
};
const defaultInteractStore: InteractStore = {
  canvasAreaSize: { width: 0, height: 0 },
  lastMouseWindow: { x: 0, y: 0 },
  lastMouseOnCanvas: { x: 0, y: 0 },
  isMouseOnCanvas: false,
  isInStroke: false,
  zoom: 1,
  zoomMin: 0.5,
  zoomMax: 8,
  touchZoomSensitivity: 0.5,
  wheelZoomStep: 0.05,
  // オフセットの初期値
  offsetOrigin: { x: 0, y: 0 },
  offset: { x: 0, y: 0 },

  isDragging: false,
};
const defaultLogStore: LogStore = {
  bottomBarText: '',
};
const defaultToolStore: ToolStore = {
  tools: defaultTools,
  activeType: ToolType.Pen,
  prevActiveType: undefined,
};

export const initEditorStore = () => {
  const [appearanceStore, setAppearanceStore] = createStore<AppearanceStore>(defaultAppearanceStore);
  const [colorStore, setColorStore] = createStore<ColorStore>(defaultColorStore);
  const [interactStore, setInteractStore] = createStore<InteractStore>(defaultInteractStore);
  const [toolStore, setToolStore] = createStore<ToolStore>(defaultToolStore);
  const [logStore, setLogStore] = createStore<LogStore>(defaultLogStore);

  return {
    appearanceStore,
    setAppearanceStore,
    colorStore,
    setColorStore,
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

export const interactStore = editorStore.interactStore;
export const setInteractStore = editorStore.setInteractStore;

export const logStore = editorStore.logStore;
export const setLogStore = editorStore.setLogStore;

export const toolStore = editorStore.toolStore;
export const setToolStore = editorStore.setToolStore;
