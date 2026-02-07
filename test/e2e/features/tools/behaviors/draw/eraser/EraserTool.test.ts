import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { historyManager } from '~/features/history';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { setToolStore, toolStore } from '~/stores/EditorStores';
import { setGlobalConfig } from '~/stores/GlobalStores';
import { buildLayer, resetStore, setupWebGL } from '../../../../history/helpers';

const args = (x: number, y: number, event?: PointerEvent) => ({
  layerId: 'layer-1',
  rawPosition: { x, y },
  position: { x, y },
  color: [255, 20, 30, 255] as [number, number, number, number],
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

describe('EraserTool (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
    resetStore([buildLayer('layer-1')], { width: 5, height: 5 });
    historyManager.clearHistory();
    setGlobalConfig('editor', 'useRawMove', false);
    setToolStore('tools', 'eraser', 'presets', 'options', 'default', { size: 1, shape: 'circle' });
  });

  afterEach(() => {
    historyManager.clearHistory();
    layerManager.disposeAll();
    canvas.remove();
  });

  it('erases painted pixels and registers history', () => {
    const filled = new Uint8ClampedArray(5 * 5 * 4);
    for (let i = 0; i < 25; i++) {
      filled[i * 4 + 0] = 10;
      filled[i * 4 + 1] = 20;
      filled[i * 4 + 2] = 30;
      filled[i * 4 + 3] = 255;
    }
    layerManager.registerLayer('layer-1', filled, 5, 5, { inputSpace: 'layer' });
    const ToolCtor = toolStore.tools.eraser.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();
    const before = countOpaquePixels('layer-1', 5, 5);

    const start = tool.onStart(args(1, 1));
    const move = tool.onMove(args(3, 3));
    const end = tool.onEnd(args(3, 3));
    const after = countOpaquePixels('layer-1', 5, 5);

    expect(start).toEqual({ shouldUpdate: true });
    expect(move).toEqual({ shouldUpdate: true });
    expect(end).toEqual({ shouldUpdate: true });
    expect(after).toBeLessThan(before);
    expect(historyManager.canUndo()).toBe(true);
  });

  it('supports raw move drawing path when useRawMove is enabled', () => {
    const filled = new Uint8ClampedArray(5 * 5 * 4);
    for (let i = 0; i < 25; i++) {
      filled[i * 4 + 3] = 255;
    }
    layerManager.registerLayer('layer-1', filled, 5, 5, { inputSpace: 'layer' });
    setGlobalConfig('editor', 'useRawMove', true);
    const ToolCtor = toolStore.tools.eraser.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      onRawMove: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();
    const before = countOpaquePixels('layer-1', 5, 5);

    const start = tool.onStart(args(1, 1));
    const move = tool.onMove(args(2, 2));
    const rawMove = tool.onRawMove(args(2, 2));
    const end = tool.onEnd(args(2, 2));
    const after = countOpaquePixels('layer-1', 5, 5);

    expect(start).toEqual({ shouldUpdate: true });
    expect(move).toEqual({ shouldUpdate: false });
    expect(rawMove).toEqual({ shouldUpdate: true });
    expect(end).toEqual({ shouldUpdate: true });
    expect(after).toBeLessThan(before);
  });

  it('cancels stroke safely', () => {
    layerManager.registerLayer('layer-1', new Uint8ClampedArray(5 * 5 * 4), 5, 5, { inputSpace: 'layer' });
    const ToolCtor = toolStore.tools.eraser.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onCancel: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    tool.onStart(args(2, 2));
    const canceled = tool.onCancel(args(2, 2));

    expect(canceled).toEqual({ shouldUpdate: false });
  });
});
