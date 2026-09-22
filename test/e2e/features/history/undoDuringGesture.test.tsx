import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StrokeCanvas } from '~/components/canvas/canvas/StrokeCanvas';
import { historyManager, tryUndo } from '~/features/history';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import { setActiveToolCategory } from '~/features/tools/ToolController';
import { defaultInteractStore } from '~/stores/editor/InteractStore';
import { setInteractStore, setToolStore } from '~/stores/EditorStores';
import { setGlobalConfig } from '~/stores/GlobalStores';
import { buildLayer, registerLayers, resetStore, setupWebGL } from './helpers';

const SIZE = 16;

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

const countOpaquePixels = () => {
  const raw = layerManager.exportRawCanvas('a');
  let count = 0;
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (raw[i * 4 + 3] > 0) count++;
  }
  return count;
};

/**
 * undo and redo rewrite the layers and the stacks that a gesture in flight is reading and about to write
 * back to. a gesture is the user's own to end, so the press ends it rather than being turned down - and
 * ending it is the whole of what that press does, because cancelling the gesture and stepping history in
 * the same press would change the project twice for one keystroke.
 */
describe('undo pressed mid-gesture (e2e)', () => {
  let canvas: HTMLCanvasElement;
  let dispose: (() => void) | undefined;
  let root: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
    const layers = [buildLayer('a')];
    resetStore(layers, { width: SIZE, height: SIZE });
    registerLayers(layers, SIZE, SIZE);
    historyManager.clearHistory();
    selectionManager.clearAll();
    floatingMoveManager.cancel();
    setInteractStore({ ...defaultInteractStore });
    setGlobalConfig('editor', 'useRawMove', false);
    setToolStore('tools', 'pen', 'presets', 'options', 'default', { size: 1, shape: 'circle' });

    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    floatingMoveManager.cancel();
    selectionManager.clearAll();
    historyManager.clearHistory();
    layerManager.disposeAll();
    canvas.remove();
    document.body.innerHTML = '';
  });

  /** @description the DOM StrokeCanvas expects around it: it reads the outer area out of the document. */
  const mountStrokeCanvas = () => {
    const outer = document.createElement('div');
    outer.id = 'outer-stroke-detect-area';
    root.appendChild(outer);
    dispose = render(() => <StrokeCanvas />, root);
    return root.querySelector('#interact-area') as HTMLDivElement;
  };

  const pointer = (type: string, x: number, y: number, init?: PointerEventInit) =>
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
      ...init,
    });

  it('ends the stroke on the first press and steps history on the next', async () => {
    setActiveToolCategory('pen');
    const area = mountStrokeCanvas();

    // one finished stroke, so there is something in history that a mistaken undo would take away
    area.dispatchEvent(pointer('pointerdown', 2, 2));
    window.dispatchEvent(pointer('pointermove', 5, 2));
    window.dispatchEvent(pointer('pointerup', 5, 2));
    await settled();
    expect(historyManager.getUndoStack()).toHaveLength(1);
    const afterFirstStroke = countOpaquePixels();
    expect(afterFirstStroke).toBeGreaterThan(0);

    // a second stroke, still under the pointer
    area.dispatchEvent(pointer('pointerdown', 2, 8));
    window.dispatchEvent(pointer('pointermove', 9, 8));
    await settled();
    expect(historyManager.getUndoStack()).toHaveLength(1);
    const midStroke = countOpaquePixels();
    expect(midStroke).toBeGreaterThan(afterFirstStroke);

    tryUndo();
    await settled();

    // the open stroke was ended - it has a history entry of its own now - and nothing was undone: the
    // first stroke's pixels are all still there
    expect(historyManager.getUndoStack()).toHaveLength(2);
    expect(countOpaquePixels()).toBe(midStroke);

    // the pointerup that eventually arrives finds nothing open and registers nothing further
    window.dispatchEvent(pointer('pointerup', 9, 8));
    await settled();
    expect(historyManager.getUndoStack()).toHaveLength(2);

    tryUndo();
    await settled();

    // now history steps, and the second stroke comes off cleanly rather than leaving a mixture behind
    expect(historyManager.getUndoStack()).toHaveLength(1);
    expect(countOpaquePixels()).toBe(afterFirstStroke);

    tryUndo();
    await settled();

    expect(historyManager.getUndoStack()).toHaveLength(0);
    expect(countOpaquePixels()).toBe(0);
  });

  it('ends the stroke when the drag key comes down, rather than only dropping its claim', async () => {
    // the key that makes a drag out of a stroke is the one undo is bound to, so it arrives first on the way
    // to ctrl+z. the stroke has to be settled by it: dropping the claim alone would leave frasco holding
    // the base texture with the undo that follows free to rewrite the layer underneath it.
    setActiveToolCategory('pen');
    const area = mountStrokeCanvas();

    area.dispatchEvent(pointer('pointerdown', 2, 2));
    window.dispatchEvent(pointer('pointermove', 5, 2));
    await settled();
    expect(historyManager.getUndoStack()).toHaveLength(0);
    const midStroke = countOpaquePixels();
    expect(midStroke).toBeGreaterThan(0);

    // ctrl comes down while the pointer is still moving: the stroke stops being a drawable click here. the
    // position is the one already drawn to, so what the end stamps cannot be mistaken for the stroke having
    // carried on.
    window.dispatchEvent(pointer('pointermove', 5, 2, { ctrlKey: true }));
    await settled();

    // the stroke is in history at the point it reached, not left in the layer unaccounted for
    expect(historyManager.getUndoStack()).toHaveLength(1);
    expect(countOpaquePixels()).toBe(midStroke);

    // and the undo that the same keypress leads to steps history rather than being spent on the gesture
    tryUndo();
    await settled();

    expect(historyManager.getUndoStack()).toHaveLength(0);
    expect(countOpaquePixels()).toBe(0);
  });

  it('leaves history alone when the press only ends a gesture', async () => {
    setActiveToolCategory('pen');
    const area = mountStrokeCanvas();

    // nothing in history at all: the press must still be spent on the stroke, not reported as an empty undo
    area.dispatchEvent(pointer('pointerdown', 4, 4));
    window.dispatchEvent(pointer('pointermove', 7, 4));
    await settled();

    tryUndo();
    await settled();

    expect(historyManager.getUndoStack()).toHaveLength(1);
    expect(historyManager.getRedoStack()).toHaveLength(0);
    expect(countOpaquePixels()).toBeGreaterThan(0);
  });
});
