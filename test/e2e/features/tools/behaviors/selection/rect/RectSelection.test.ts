import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { historyManager } from '~/features/history';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { defaultInteractStore } from '~/stores/editor/InteractStore';
import { interactStore, setInteractStore, toolStore } from '~/stores/EditorStores';
import { buildLayer, resetStore, setupWebGL } from '../../../../history/helpers';

const args = (x: number, y: number, event?: PointerEvent) => ({
  layerId: 'layer-1',
  rawPosition: { x, y },
  position: { x, y },
  color: [0, 0, 0, 255],
  event,
});

describe('RectSelection (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
    resetStore([buildLayer('layer-1')], { width: 4, height: 4 });
    historyManager.clearHistory();
    selectionManager.clearAll();
    setInteractStore({ ...defaultInteractStore, selectionEditMode: 'replace' });
  });

  afterEach(() => {
    selectionManager.clearAll();
    historyManager.clearHistory();
    layerManager.disposeAll();
    canvas.remove();
  });

  it('replace drag creates rectangle selection and commits it to back on end', () => {
    const ToolCtor = toolStore.tools.rectSelection.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    tool.onStart(args(1, 1));
    tool.onMove(args(2, 3));
    expect(selectionManager.getFront()?.getBoundBox()).toEqual({ left: 1, top: 1, right: 2, bottom: 3 });

    tool.onEnd(args(2, 3));

    expect(selectionManager.getFront()).toBeUndefined();
    expect(selectionManager.getBack()?.getBoundBox()).toEqual({ left: 1, top: 1, right: 2, bottom: 3 });
    expect(historyManager.canUndo()).toBe(true);
  });

  it('add and subtract modes update existing selection', () => {
    const seed = new SelectionMask(4, 4);
    seed.setFlag({ x: 0, y: 0 }, 1);
    selectionManager.setBack(seed);
    const ToolCtor = toolStore.tools.rectSelection.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    tool.onStart(args(2, 2, { shiftKey: true } as PointerEvent));
    tool.onMove(args(3, 3, { shiftKey: true } as PointerEvent));
    tool.onEnd(args(3, 3, { shiftKey: true } as PointerEvent));
    expect(selectionManager.getBack()?.getBoundBox()).toEqual({ left: 0, top: 0, right: 3, bottom: 3 });

    tool.onStart(args(3, 3, { altKey: true } as PointerEvent));
    tool.onMove(args(3, 3, { altKey: true } as PointerEvent));
    tool.onEnd(args(3, 3, { altKey: true } as PointerEvent));

    expect(selectionManager.getBack()?.getMask()[3 * 4 + 3]).toBe(0);
  });

  it('ctrl-drag uses move mode, commits offset, and restores previous edit mode', () => {
    const seed = new SelectionMask(4, 4);
    seed.setFlag({ x: 0, y: 0 }, 1);
    selectionManager.setBack(seed);
    const ToolCtor = toolStore.tools.rectSelection.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    tool.onStart(args(0, 0, { ctrlKey: true } as PointerEvent));
    tool.onMove(args(2, 1, { ctrlKey: true } as PointerEvent));
    expect(selectionManager.getOffset()).toEqual({ x: 2, y: 1 });
    expect(interactStore.selectionEditMode).toBe('move');

    tool.onEnd(args(2, 1, { ctrlKey: true } as PointerEvent));

    expect(selectionManager.getOffset()).toEqual({ x: 0, y: 0 });
    expect(selectionManager.getBack()?.getMask()[1 * 4 + 2]).toBe(1);
    expect(interactStore.selectionEditMode).toBe('replace');
  });

  it('cancel clears front preview in replace mode', () => {
    const ToolCtor = toolStore.tools.rectSelection.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      onCancel: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    tool.onStart(args(1, 1));
    tool.onMove(args(3, 3));
    expect(selectionManager.getFront()?.getBoundBox()).toEqual({ left: 1, top: 1, right: 3, bottom: 3 });

    const canceled = tool.onCancel(args(3, 3));

    expect(canceled).toEqual({ shouldUpdate: false });
    expect(selectionManager.getFront()).toBeUndefined();
    expect(selectionManager.getBack()).toBeUndefined();
  });

  it('ctrl-cancel restores previous mode and offset', () => {
    const seed = new SelectionMask(4, 4);
    seed.setFlag({ x: 0, y: 0 }, 1);
    selectionManager.setBack(seed);
    const ToolCtor = toolStore.tools.rectSelection.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      onCancel: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    tool.onStart(args(0, 0, { ctrlKey: true } as PointerEvent));
    tool.onMove(args(2, 2, { ctrlKey: true } as PointerEvent));
    expect(selectionManager.getOffset()).toEqual({ x: 2, y: 2 });
    expect(interactStore.selectionEditMode).toBe('move');

    const canceled = tool.onCancel(args(2, 2, { ctrlKey: true } as PointerEvent));

    expect(canceled).toEqual({ shouldUpdate: false });
    expect(selectionManager.getOffset()).toEqual({ x: 0, y: 0 });
    expect(interactStore.selectionEditMode).toBe('replace');
    expect(selectionManager.getBack()?.getMask()[0]).toBe(1);
  });
});
