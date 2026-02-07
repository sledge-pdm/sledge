import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { historyManager } from '~/features/history';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { setToolStore, toolStore } from '~/stores/EditorStores';
import { setGlobalConfig } from '~/stores/GlobalStores';
import { buildLayer, resetStore, setupWebGL } from '../../../../history/helpers';

const args = (x: number, y: number, color: [number, number, number, number], event?: PointerEvent) => ({
  layerId: 'layer-1',
  rawPosition: { x, y },
  position: { x, y },
  color,
  event,
  presetName: 'default',
});

const countOpaquePixels = (layerId: string, width: number, height: number) => {
  const raw = layerManager.exportRawCanvas(layerId);
  let count = 0;
  for (let i = 0; i < width * height; i++) {
    if (raw[i * 4 + 3] > 0) count++;
  }
  return count;
};

describe('PenTool (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
    resetStore([buildLayer('layer-1')], { width: 5, height: 5 });
    historyManager.clearHistory();
    setGlobalConfig('editor', 'useRawMove', false);
    setToolStore('tools', 'pen', 'presets', 'options', 'default', { size: 1, shape: 'circle' });
  });

  afterEach(() => {
    historyManager.clearHistory();
    layerManager.disposeAll();
    canvas.remove();
  });

  it('draws a stroke to active layer and registers history on end', () => {
    layerManager.registerLayer('layer-1', new Uint8ClampedArray(5 * 5 * 4), 5, 5, { inputSpace: 'layer' });
    const ToolCtor = toolStore.tools.pen.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    const start = tool.onStart(args(1, 1, [255, 0, 0, 255]));
    const move = tool.onMove(args(3, 3, [255, 0, 0, 255]));
    const end = tool.onEnd(args(3, 3, [255, 0, 0, 255]));

    expect(start).toEqual({ shouldUpdate: true });
    expect(move).toEqual({ shouldUpdate: true });
    expect(end).toEqual({ shouldUpdate: true });
    expect(countOpaquePixels('layer-1', 5, 5)).toBeGreaterThan(0);
    expect(historyManager.canUndo()).toBe(true);
  });

  it('adds used brush size to size history when stroke starts', () => {
    layerManager.registerLayer('layer-1', new Uint8ClampedArray(5 * 5 * 4), 5, 5, { inputSpace: 'layer' });
    setToolStore('tools', 'pen', 'presets', 'options', 'default', { size: 4, shape: 'circle', sizeHistory: [1, 2] });
    const ToolCtor = toolStore.tools.pen.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    tool.onStart(args(2, 2, [0, 255, 0, 255]));
    tool.onEnd(args(2, 2, [0, 255, 0, 255]));

    expect(toolStore.tools.pen.presets?.options.default.sizeHistory).toEqual([4, 1, 2]);
  });

  it('uses onRawMove for drawing when useRawMove is enabled', () => {
    layerManager.registerLayer('layer-1', new Uint8ClampedArray(5 * 5 * 4), 5, 5, { inputSpace: 'layer' });
    setGlobalConfig('editor', 'useRawMove', true);
    const ToolCtor = toolStore.tools.pen.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      onRawMove: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    const start = tool.onStart(args(0, 0, [255, 0, 0, 255]));
    const move = tool.onMove(args(1, 1, [255, 0, 0, 255]));
    const rawMove = tool.onRawMove(args(1, 1, [255, 0, 0, 255]));
    const end = tool.onEnd(args(1, 1, [255, 0, 0, 255]));

    expect(start).toEqual({ shouldUpdate: true });
    expect(move).toEqual({ shouldUpdate: false });
    expect(rawMove).toEqual({ shouldUpdate: true });
    expect(end).toEqual({ shouldUpdate: true });
    expect(countOpaquePixels('layer-1', 5, 5)).toBeGreaterThan(0);
  });

  it('switches to manual eraser mode when right button is pressed', () => {
    const filled = new Uint8ClampedArray(5 * 5 * 4);
    for (let i = 0; i < 25; i++) {
      filled[i * 4] = 120;
      filled[i * 4 + 1] = 120;
      filled[i * 4 + 2] = 120;
      filled[i * 4 + 3] = 255;
    }
    layerManager.registerLayer('layer-1', filled, 5, 5, { inputSpace: 'layer' });
    const ToolCtor = toolStore.tools.pen.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();
    const before = countOpaquePixels('layer-1', 5, 5);

    const start = tool.onStart(args(2, 2, [255, 0, 0, 255], { buttons: 2 } as PointerEvent));
    const end = tool.onEnd(args(2, 2, [255, 0, 0, 255], { buttons: 2 } as PointerEvent));
    const after = countOpaquePixels('layer-1', 5, 5);

    expect(start).toEqual({ shouldUpdate: true });
    expect(end).toEqual({ shouldUpdate: true });
    expect(after).toBeLessThan(before);
  });

  it('returns no-op when target layer is not registered', () => {
    const ToolCtor = toolStore.tools.pen.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    const start = tool.onStart(args(1, 1, [255, 0, 0, 255]));

    expect(start).toEqual({ shouldUpdate: false });
  });
});
