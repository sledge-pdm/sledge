// editorStore.tsx
import { createStore } from 'solid-js/store';
import { createTool } from '~/models/tool/ToolFactory';
import { ToolType } from '~/types/Tool';
import { ToolStore } from './editor/ToolsStore';
import { ColorStore, PaletteType } from './editor/ColorStore';

const defaultColorStore: ColorStore = {
  currentPalette: 'primary' as PaletteType,
  primary: '#000000', // 通常の描画色
  secondary: '#ffffff', // 背景・消しゴムなど
  swatches: [
    '#000000',
    '#FFFFFF',
    '#ffff00',
    '#00ffff',
    '#00ff00',
    '#ff00ff',
    '#ff0000',
    '#0000ff',
    '#000080',
    '#400080',
  ],
};

const defaultToolStore: ToolStore = {
  usingIndex: 0,
  tools: [
    createTool(ToolType.Pen, 'pen', 1),
    createTool(ToolType.Eraser, 'eraser', 1),
    createTool(ToolType.Fill, 'fill', 1),
  ],
};

export const initEditorStore = () => {
  const [colorStore, setColorStore] =
    createStore<ColorStore>(defaultColorStore);
  const [toolStore, setToolStore] = createStore<ToolStore>(defaultToolStore);

  return {
    colorStore,
    setColorStore,
    toolStore,
    setToolStore,
  };
};

const editorStore = initEditorStore();

export const colorStore = editorStore.colorStore;
export const setColorStore = editorStore.setColorStore;

export const toolStore = editorStore.toolStore;
export const setToolStore = editorStore.setToolStore;
