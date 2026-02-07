import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { historyManager } from '~/features/history';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
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

describe('AutoSelection (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
    resetStore([buildLayer('layer-1')], { width: 4, height: 4 });
    historyManager.clearHistory();
    selectionManager.clearAll();
    setInteractStore({ ...defaultInteractStore, selectionEditMode: 'replace' });
    setToolStore('tools', 'autoSelection', 'presets', 'options', 'default', { threshold: 0 });
  });

  afterEach(() => {
    selectionManager.clearAll();
    historyManager.clearHistory();
    layerManager.disposeAll();
    canvas.remove();
  });

  it('creates contiguous region selection and commits it on end', () => {
    const buffer = new Uint8ClampedArray(4 * 4 * 4);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const idx = (y * 4 + x) * 4;
        const inRegion = x <= 1 && y <= 1;
        buffer[idx] = inRegion ? 20 : 200;
        buffer[idx + 1] = inRegion ? 20 : 200;
        buffer[idx + 2] = inRegion ? 20 : 200;
        buffer[idx + 3] = 255;
      }
    }
    layerManager.registerLayer('layer-1', buffer, 4, 4, { inputSpace: 'layer' });
    const ToolCtor = toolStore.tools.autoSelection.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    tool.onStart(args(0, 0));
    const frontMask = selectionManager.getFront()?.getMask();
    expect(frontMask).toBeDefined();
    expect(frontMask?.[0]).toBe(1);

    tool.onEnd(args(0, 0));

    expect(selectionManager.getFront()).toBeUndefined();
    expect(selectionManager.getBack()?.getMask()).toEqual(frontMask);
    expect(historyManager.canUndo()).toBe(true);
  });

  it('supports add/subtract merge modes with existing back selection', () => {
    const buffer = new Uint8ClampedArray(4 * 4 * 4);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const idx = (y * 4 + x) * 4;
        const inRegion = x <= 1 && y <= 1;
        buffer[idx] = inRegion ? 20 : 200;
        buffer[idx + 1] = inRegion ? 20 : 200;
        buffer[idx + 2] = inRegion ? 20 : 200;
        buffer[idx + 3] = 255;
      }
    }
    layerManager.registerLayer('layer-1', buffer, 4, 4, { inputSpace: 'layer' });

    const seed = new SelectionMask(4, 4);
    seed.setFlag({ x: 3, y: 3 }, 1);
    selectionManager.setBack(seed);
    const ToolCtor = toolStore.tools.autoSelection.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onEnd: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    tool.onStart(args(0, 0, { shiftKey: true } as PointerEvent));
    tool.onEnd(args(0, 0, { shiftKey: true } as PointerEvent));
    expect(selectionManager.getBack()?.getMask()[3 * 4 + 3]).toBe(1);

    tool.onStart(args(0, 0, { altKey: true } as PointerEvent));
    tool.onEnd(args(0, 0, { altKey: true } as PointerEvent));
    expect(selectionManager.getBack()?.getMask()[0]).toBe(0);
  });

  it('clears preview on cancel and does not commit history', () => {
    const buffer = new Uint8ClampedArray(4 * 4 * 4);
    for (let i = 0; i < 16; i++) {
      buffer[i * 4] = 30;
      buffer[i * 4 + 1] = 30;
      buffer[i * 4 + 2] = 30;
      buffer[i * 4 + 3] = 255;
    }
    layerManager.registerLayer('layer-1', buffer, 4, 4, { inputSpace: 'layer' });
    const ToolCtor = toolStore.tools.autoSelection.behavior.constructor as new () => {
      onStart: (args: any) => { shouldUpdate: boolean };
      onMove: (args: any) => { shouldUpdate: boolean };
      onCancel: (args: any) => { shouldUpdate: boolean };
    };
    const tool = new ToolCtor();

    tool.onStart(args(0, 0));
    const frontBeforeCancel = selectionManager.getFront();
    const move = tool.onMove(args(1, 1));
    const canceled = tool.onCancel(args(1, 1));

    expect(frontBeforeCancel).toBeDefined();
    expect(move).toEqual({ shouldUpdate: false });
    expect(canceled).toEqual({ shouldUpdate: false });
    expect(selectionManager.getFront()).toBeUndefined();
    expect(selectionManager.getBack()).toBeUndefined();
    expect(historyManager.canUndo()).toBe(false);
  });
});
