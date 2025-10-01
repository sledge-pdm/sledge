// editorStore.tsx
import { FileLocation, Size2D, Vec2 } from '@sledge/core';
import { createStore } from 'solid-js/store';
import { SectionTab } from '~/components/section/SectionTabs';
import { PaletteType, RGBAColor } from '~/features/color';
import { toolCategories, ToolCategory, ToolCategoryId } from '~/tools/Tools';

type AppearanceStore = {
  leftSide: {
    shown: boolean;
    tabs: SectionTab[];
    selectedIndex: number;
  };
  rightSide: {
    shown: boolean;
    tabs: SectionTab[];
    selectedIndex: number;
  };
};
type ColorStore = {
  currentPalette: PaletteType;
  primary: string;
  secondary: string;
  swatches: string[];
};
type FileStore = {
  openAs: 'project' | 'image';
  savedLocation: FileLocation;
};
type InteractStore = {
  canvasAreaSize: Size2D;
  lastMouseWindow: Vec2;
  lastMouseOnCanvas: Vec2;
  isMouseOnCanvas: boolean;
  isInStroke: boolean;
  isPenOut: boolean;
  zoom: number;
  zoomByReference: number;
  zoomMin: number;
  zoomMax: number;
  touchZoomSensitivity: number;
  wheelZoomStep: number;
  offsetOrigin: Vec2;
  offset: Vec2;
  isDragging: boolean;
  rotation: number;
  verticalFlipped: boolean;
  horizontalFlipped: boolean;

  isCanvasSizeFrameMode: boolean;
  canvasSizeFrameOffset: Vec2;
  canvasSizeFrameSize: Size2D;
};
type DebugPoint = Vec2 & {
  color: RGBAColor;
};
export type BottomBarKind = 'info' | 'warn' | 'error';
type LogStore = {
  bottomBarText: string;
  bottomBarKind: BottomBarKind;
  canvasDebugPoints: DebugPoint[]; // デバッグ用の点の配列
};
export type SelectionLimitMode = 'none' | 'outside' | 'inside';
export type ToolStore = {
  tools: Record<ToolCategoryId, ToolCategory>;
  activeToolCategory: ToolCategoryId;
  prevActiveCategory: ToolCategoryId | undefined;
  selectionLimitMode: SelectionLimitMode;
};

const defaultAppearanceStore: AppearanceStore = {
  leftSide: {
    shown: true,
    tabs: ['editor', 'effects', 'files', 'danger'],
    selectedIndex: 0,
  },
  rightSide: {
    shown: false,
    tabs: ['project', 'export', 'history'],
    selectedIndex: 0,
  },
};
const defaultColorStore: ColorStore = {
  currentPalette: 'primary' as PaletteType,
  primary: '#000000', // 通常の描画色
  secondary: '#ffffff', // 背景・消しゴムなど
  swatches: ['#000000', '#FFFFFF', '#ffff00', '#00ffff', '#00ff00', '#ff00ff', '#ff0000', '#0000ff', '#000080', '#400080'],
};
const defaultFileStore: FileStore = {
  openAs: 'project',
  savedLocation: {
    name: undefined,
    path: undefined,
  },
};
const defaultInteractStore: InteractStore = {
  canvasAreaSize: { width: 0, height: 0 },
  lastMouseWindow: { x: 0, y: 0 },
  lastMouseOnCanvas: { x: 0, y: 0 },
  isMouseOnCanvas: false,
  isPenOut: false,
  isInStroke: false,
  zoom: 1,
  zoomByReference: 1,
  // zoomMin: 0.5,
  zoomMin: 0.01,
  // zoomMax: 8,
  zoomMax: 100,
  touchZoomSensitivity: 0.5,
  wheelZoomStep: 0.05,
  // オフセットの初期値
  offsetOrigin: { x: 0, y: 0 },
  offset: { x: 0, y: 0 },

  rotation: 0,

  verticalFlipped: false,
  horizontalFlipped: false,

  isDragging: false,

  isCanvasSizeFrameMode: false,
  canvasSizeFrameOffset: { x: 0, y: 0 },
  canvasSizeFrameSize: { width: 0, height: 0 },
};
const defaultLogStore: LogStore = {
  bottomBarText: 'rotate: shift+wheel / drag: ctrl+drag',
  bottomBarKind: 'info',
  canvasDebugPoints: [],
};
const defaultToolStore: ToolStore = {
  tools: toolCategories,
  activeToolCategory: 'pen',
  prevActiveCategory: undefined,
  selectionLimitMode: 'inside',
};

export const initEditorStore = () => {
  const [appearanceStore, setAppearanceStore] = createStore<AppearanceStore>(defaultAppearanceStore);
  const [colorStore, setColorStore] = createStore<ColorStore>(defaultColorStore);
  const [fileStore, setFileStore] = createStore<FileStore>(defaultFileStore);
  const [interactStore, setInteractStore] = createStore<InteractStore>(defaultInteractStore);
  const [toolStore, setToolStore] = createStore<ToolStore>(defaultToolStore);
  const [logStore, setLogStore] = createStore<LogStore>(defaultLogStore);

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
