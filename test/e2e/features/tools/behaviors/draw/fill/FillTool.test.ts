import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { historyManager } from '~/features/history';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { defaultInteractStore } from '~/stores/editor/InteractStore';
import { setInteractStore, setToolStore, toolStore } from '~/stores/EditorStores';
import { buildLayer, resetStore, setupWebGL } from '../../../../history/helpers';

const args = (x: number, y: number, presetName = 'default') => ({
  layerId: 'layer-1',
  rawPosition: { x, y },
  position: { x, y },
  color: [200, 10, 20, 255],
  presetName,
});

const readR = (x: number, y: number) => layerManager.readPixelCanvas('layer-1', x, y)?.[0] ?? 0;

describe('FillTool (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
    resetStore([buildLayer('layer-1')], { width: 3, height: 3 });
    historyManager.clearHistory();
    selectionManager.clearAll();
    setInteractStore({ ...defaultInteractStore, isPointerOnCanvas: true });
    setToolStore('tools', 'fill', 'presets', 'options', 'default', {
      threshold: 0,
      selectionFillMode: 'inside',
    });
  });

  afterEach(() => {
    selectionManager.clearAll();
    historyManager.clearHistory();
    layerManager.disposeAll();
    canvas.remove();
  });

  it('returns no-op when pointer is outside canvas', () => {
    layerManager.registerLayer('layer-1', new Uint8ClampedArray(3 * 3 * 4), 3, 3, { inputSpace: 'layer' });
    setInteractStore('isPointerOnCanvas', false);
    const ToolCtor = toolStore.tools.fill.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    const result = tool.onStart(args(1, 1));

    expect(result).toEqual({ shouldUpdate: false });
    expect(historyManager.canUndo()).toBe(false);
  });

  it('fills contiguous region and registers history when no selection exists', () => {
    const base = new Uint8ClampedArray(3 * 3 * 4);
    for (let i = 0; i < 9; i++) {
      const idx = i * 4;
      base[idx] = 1;
      base[idx + 1] = 1;
      base[idx + 2] = 1;
      base[idx + 3] = 255;
    }
    layerManager.registerLayer('layer-1', base, 3, 3, { inputSpace: 'layer' });
    const ToolCtor = toolStore.tools.fill.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    const result = tool.onStart(args(1, 1));

    expect(result).toEqual({ shouldUpdate: true });
    expect(readR(0, 0)).toBe(200);
    expect(readR(1, 1)).toBe(200);
    expect(readR(2, 2)).toBe(200);
    expect(historyManager.canUndo()).toBe(true);
  });

  it('applies area-fill only on selection mask when selectionFillMode is area', () => {
    layerManager.registerLayer('layer-1', new Uint8ClampedArray(3 * 3 * 4), 3, 3, { inputSpace: 'layer' });
    const mask = new SelectionMask(3, 3);
    mask.setFlag({ x: 0, y: 0 }, 1);
    mask.setFlag({ x: 2, y: 2 }, 1);
    selectionManager.setBack(mask);
    setToolStore('tools', 'fill', 'presets', 'options', 'default', {
      threshold: 0,
      selectionFillMode: 'area',
    });
    const ToolCtor = toolStore.tools.fill.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    const result = tool.onStart(args(1, 1));

    expect(result).toEqual({ shouldUpdate: true });
    expect(readR(0, 0)).toBe(200);
    expect(readR(2, 2)).toBe(200);
    expect(readR(1, 1)).toBe(0);
    expect(historyManager.canUndo()).toBe(true);
  });

  it('applies inside-fill only to selected mask region', () => {
    const base = new Uint8ClampedArray(3 * 3 * 4);
    for (let i = 0; i < 9; i++) {
      base[i * 4] = 10;
      base[i * 4 + 1] = 10;
      base[i * 4 + 2] = 10;
      base[i * 4 + 3] = 255;
    }
    layerManager.registerLayer('layer-1', base, 3, 3, { inputSpace: 'layer' });
    const mask = new SelectionMask(3, 3);
    mask.setFlag({ x: 1, y: 1 }, 1);
    selectionManager.setBack(mask);
    setToolStore('tools', 'fill', 'presets', 'options', 'default', {
      threshold: 0,
      selectionFillMode: 'inside',
    });
    const ToolCtor = toolStore.tools.fill.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    const result = tool.onStart(args(1, 1));

    expect(result).toEqual({ shouldUpdate: true });
    expect(readR(1, 1)).toBe(200);
    expect(readR(0, 0)).toBe(10);
    expect(readR(2, 2)).toBe(10);
  });

  it('ignores selection mask when selectionFillMode is ignore', () => {
    const base = new Uint8ClampedArray(3 * 3 * 4);
    for (let i = 0; i < 9; i++) {
      base[i * 4] = 5;
      base[i * 4 + 1] = 5;
      base[i * 4 + 2] = 5;
      base[i * 4 + 3] = 255;
    }
    layerManager.registerLayer('layer-1', base, 3, 3, { inputSpace: 'layer' });
    const mask = new SelectionMask(3, 3);
    mask.setFlag({ x: 0, y: 0 }, 1);
    selectionManager.setBack(mask);
    setToolStore('tools', 'fill', 'presets', 'options', 'default', {
      threshold: 0,
      selectionFillMode: 'ignore',
    });
    const ToolCtor = toolStore.tools.fill.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    const result = tool.onStart(args(1, 1));

    expect(result).toEqual({ shouldUpdate: true });
    expect(readR(0, 0)).toBe(200);
    expect(readR(1, 1)).toBe(200);
    expect(readR(2, 2)).toBe(200);
  });

  it('returns no-op when preset is missing', () => {
    layerManager.registerLayer('layer-1', new Uint8ClampedArray(3 * 3 * 4), 3, 3, { inputSpace: 'layer' });
    const ToolCtor = toolStore.tools.fill.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    const start = tool.onStart(args(1, 1, 'missing'));
    const move = tool.onMove(args(1, 1));
    const end = tool.onEnd(args(1, 1));

    expect(start).toEqual({ shouldUpdate: false });
    expect(move).toEqual({ shouldUpdate: false });
    expect(end).toEqual({ shouldUpdate: false });
    expect(historyManager.canUndo()).toBe(false);
  });
});
