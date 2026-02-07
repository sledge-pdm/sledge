import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { historyManager } from '~/features/history';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import { defaultInteractStore } from '~/stores/editor/InteractStore';
import { setInteractStore, setToolStore, toolStore } from '~/stores/EditorStores';
import { buildLayer, resetStore, setupWebGL } from '../../../../history/helpers';

const args = (x: number, y: number, event?: PointerEvent) => ({
  layerId: 'layer-1',
  rawPosition: { x, y },
  position: { x, y },
  color: [0, 0, 0, 255],
  event,
  presetName: 'default',
});

describe('LassoSelection (e2e)', () => {
  let canvas: HTMLCanvasElement;
  let now = 0;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
    resetStore([buildLayer('layer-1')], { width: 6, height: 6 });
    historyManager.clearHistory();
    selectionManager.clearAll();
    now = 0;
    setInteractStore({ ...defaultInteractStore, selectionEditMode: 'replace' });
    setToolStore('tools', 'lassoSelection', 'presets', 'options', 'default', { fillMode: 'nonzero' });
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    selectionManager.clearAll();
    historyManager.clearHistory();
    layerManager.disposeAll();
    canvas.remove();
  });

  it('builds polygon preview from drag points and commits selection on end', () => {
    layerManager.registerLayer('layer-1', new Uint8ClampedArray(6 * 6 * 4), 6, 6, { inputSpace: 'layer' });
    const ToolCtor = toolStore.tools.lassoSelection.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
      getPath: () => string;
    };
    const tool = new ToolCtor();

    tool.onStart(args(1, 1));
    now = 20;
    tool.onMove(args(4, 1));
    now = 40;
    tool.onMove(args(4, 4));
    now = 60;
    tool.onMove(args(1, 4));

    expect(tool.getPath()).toContain('M 1 1');
    const frontBox = selectionManager.getFront()?.getBoundBox();
    expect(frontBox).toBeDefined();
    expect(frontBox?.left).toBe(1);
    expect(frontBox?.top).toBe(1);
    expect(frontBox?.right).toBeGreaterThanOrEqual(3);
    expect(frontBox?.bottom).toBeGreaterThanOrEqual(3);

    tool.onEnd(args(1, 4));

    expect(selectionManager.getFront()).toBeUndefined();
    const backBox = selectionManager.getBack()?.getBoundBox();
    expect(backBox).toBeDefined();
    expect(backBox?.left).toBe(1);
    expect(backBox?.top).toBe(1);
    expect(backBox?.right).toBeGreaterThanOrEqual(3);
    expect(backBox?.bottom).toBeGreaterThanOrEqual(3);
    expect(selectionManager.getBack()?.getMask()[2 * 6 + 2]).toBe(1);
    expect(historyManager.canUndo()).toBe(true);
  });

  it('throttles move updates under update interval', () => {
    layerManager.registerLayer('layer-1', new Uint8ClampedArray(6 * 6 * 4), 6, 6, { inputSpace: 'layer' });
    const ToolCtor = toolStore.tools.lassoSelection.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      getPoints: () => number[];
    };
    const tool = new ToolCtor();

    tool.onStart(args(1, 1));
    now = 5;
    tool.onMove(args(4, 1));
    const ignoredPoints = [...tool.getPoints()];
    now = 25;
    tool.onMove(args(4, 1));
    const acceptedPoints = [...tool.getPoints()];

    expect(ignoredPoints).toHaveLength(2);
    expect(acceptedPoints).toHaveLength(4);
  });

  it('cancel clears preview and leaves selection uncommitted', () => {
    layerManager.registerLayer('layer-1', new Uint8ClampedArray(6 * 6 * 4), 6, 6, { inputSpace: 'layer' });
    const ToolCtor = toolStore.tools.lassoSelection.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      onCancel: (args: any) => { shouldUpdate: boolean };
      getPath: () => string;
    };
    const tool = new ToolCtor();

    tool.onStart(args(1, 1));
    now = 20;
    tool.onMove(args(4, 1));
    const canceled = tool.onCancel(args(4, 1));

    expect(canceled).toEqual({ shouldUpdate: false });
    expect(tool.getPath()).toBe('');
    expect(selectionManager.getFront()).toBeUndefined();
    expect(selectionManager.getBack()).toBeUndefined();
    expect(historyManager.canUndo()).toBe(false);
  });
});
