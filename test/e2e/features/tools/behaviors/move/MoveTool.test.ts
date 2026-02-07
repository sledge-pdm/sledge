import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { historyManager } from '~/features/history';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { setInteractStore, toolStore } from '~/stores/EditorStores';
import { defaultInteractStore } from '~/stores/editor/InteractStore';
import { buildLayer, resetStore, setupWebGL } from '../../../history/helpers';

const args = (x: number, y: number) => ({
  layerId: 'layer-1',
  rawPosition: { x, y },
  position: { x, y },
  color: [0, 0, 0, 255],
});

describe('MoveTool (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
    resetStore([buildLayer('layer-1')], { width: 3, height: 2 });
    historyManager.clearHistory();
    selectionManager.clearAll();
    floatingMoveManager.cancel();
    setInteractStore({ ...defaultInteractStore });
  });

  afterEach(() => {
    floatingMoveManager.cancel();
    selectionManager.clearAll();
    historyManager.clearHistory();
    layerManager.disposeAll();
    canvas.remove();
  });

  it('starts full-layer move when selection is empty and updates floating offset on drag', () => {
    layerManager.registerLayer('layer-1', new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), 3, 2, {
      inputSpace: 'layer',
    });

    const ToolCtor = toolStore.tools.move.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();
    const start = tool.onStart(args(1, 0));
    const move = tool.onMove(args(2, 1));
    const end = tool.onEnd(args(2, 1));

    const floating = floatingMoveManager.getFloatingBuffer();
    expect(start).toEqual({ shouldUpdate: false });
    expect(move).toEqual({ shouldUpdate: false });
    expect(end).toEqual({ shouldUpdate: false });
    expect(floatingMoveManager.isMoving()).toBe(true);
    expect(floating?.origin).toEqual({ x: 0, y: 0 });
    expect(floating?.width).toBe(3);
    expect(floating?.height).toBe(2);
    expect(floating?.offset).toEqual({ x: 1, y: 1 });
    expect(selectionManager.hasSelection()).toBe(false);
  });

  it('moves selected fragment and commit applies buffer/selection offset', () => {
    const source = new Uint8ClampedArray([0, 0, 0, 0, 10, 20, 30, 255, 40, 50, 60, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    layerManager.registerLayer('layer-1', source, 3, 2, { inputSpace: 'layer' });

    const selection = new SelectionMask(3, 2);
    selection.setFlag({ x: 1, y: 0 }, 1);
    selection.setFlag({ x: 2, y: 0 }, 1);
    selectionManager.setBack(selection);

    const ToolCtor = toolStore.tools.move.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();
    tool.onStart(args(1, 0));
    tool.onMove(args(2, 0));
    floatingMoveManager.commit();

    expect(floatingMoveManager.isMoving()).toBe(false);
    const movedSelection = selectionManager.getBack();
    expect(movedSelection?.getBoundBox()).toEqual({ left: 2, top: 0, right: 2, bottom: 0 });
    const movedTop = layerManager.readPixelCanvas('layer-1', 2, 0);
    const movedBottom = layerManager.readPixelCanvas('layer-1', 2, 1);
    const movedVisible = [movedTop, movedBottom].some((c) => c && c[3] === 255 && (c[0] === 10 || c[0] === 40));
    expect(movedVisible).toBe(true);
    expect(historyManager.canUndo()).toBe(true);
  });

  it('returns no-op on move when start has not initialized floating move', () => {
    const ToolCtor = toolStore.tools.move.behavior.constructor as new () => {
      onMove: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    const move = tool.onMove(args(1, 1));
    const end = tool.onEnd(args(1, 1));

    expect(move).toEqual({ shouldUpdate: false });
    expect(end).toEqual({ shouldUpdate: false });
  });

  it('does not change offset when drag delta is zero', () => {
    layerManager.registerLayer('layer-1', new Uint8ClampedArray(3 * 2 * 4), 3, 2, { inputSpace: 'layer' });
    const ToolCtor = toolStore.tools.move.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    tool.onStart(args(1, 1));
    const move = tool.onMove(args(1, 1));
    const floating = floatingMoveManager.getFloatingBuffer();

    expect(move).toEqual({ shouldUpdate: false });
    expect(floating?.offset).toEqual({ x: 0, y: 0 });
  });
});
