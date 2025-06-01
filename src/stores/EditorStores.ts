// editorStore.tsx
import { createStore } from 'solid-js/store';
import { PaletteType } from '~/models/color/PaletteType';
import { RenderMode } from '~/models/layer/RenderMode';
import { Tool, ToolType } from '~/models/tool/Tool';
import { createTool } from '~/models/tool/ToolFactory';
import { Size2D } from '~/types/Size';
import { Vec2 } from '~/types/Vector';

type SideAppearanceMode = 'editor' | 'project';
type AppearanceStore = {
  sideAppearanceMode: SideAppearanceMode;
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
  currentRenderMode: RenderMode;
  bottomBarText: string;
};
type ToolStore = {
  usingIndex: number;
  tools: Tool[];
};

const defaultAppearanceStore: AppearanceStore = {
  sideAppearanceMode: 'editor',
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
  currentRenderMode: RenderMode.None,
  bottomBarText: '',
};
const defaultToolStore: ToolStore = {
  usingIndex: 0,
  tools: [
    createTool(ToolType.Pen, 'pen', 1),
    createTool(ToolType.Eraser, 'eraser', 1),
    createTool(ToolType.Fill, 'fill', 1),
    createTool(ToolType.RectSelection, 'rect select', 1),
    createTool(ToolType.Move, 'move', 1),
  ],
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
