import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyEffect } from '~/features/effect/Effects';
import { historyManager, tryUndo } from '~/features/history';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { clearLayer, mergeToBelowLayer } from '~/features/layer/service';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { setInteractStore, toolStore } from '~/stores/EditorStores';
import { defaultInteractStore } from '~/stores/editor/InteractStore';
import { buildLayer, resetStore, setupWebGL } from '../history/helpers';

const args = (x: number, y: number) => ({
  layerId: 'layer-1',
  rawPosition: { x, y },
  position: { x, y },
  color: [0, 0, 0, 255],
});

type MoveTool = {
  onStart: (args: any) => { shouldUpdate: boolean };
  onMove: (args: any) => { shouldUpdate: boolean };
};

const newMoveTool = () => new (toolStore.tools.move.behavior.constructor as new () => MoveTool)();

/** a 3x2 layer whose top-left pixel is the one every assertion below follows around. */
const RED_TOP_LEFT = () => new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

describe('a move floating while something else edits (e2e)', () => {
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

  it('spends the first undo on cancelling the move and the next one on history', () => {
    layerManager.registerLayer('layer-1', RED_TOP_LEFT(), 3, 2, { inputSpace: 'canvas' });

    // something in history to undo, so we can tell "the move was cancelled" apart from "nothing happened"
    const layer = layerManager.getLayer('layer-1');
    layer.commitHistory(undefined, { context: { tool: 'clear' } });
    layer.clear([0, 0, 0, 0]);
    expect(historyManager.canUndo()).toBe(true);
    expect(historyManager.getUndoStack().length).toBe(1);

    const tool = newMoveTool();
    tool.onStart(args(0, 0));
    tool.onMove(args(2, 1));
    expect(floatingMoveManager.isMoving()).toBe(true);

    tryUndo();

    // the move is gone and history has not moved: undoing the clear as well would have done two things to
    // the project for one keypress
    expect(floatingMoveManager.isMoving()).toBe(false);
    expect(historyManager.getUndoStack().length).toBe(1);
    expect(layerManager.readPixelCanvas('layer-1', 0, 0)).toEqual([0, 0, 0, 0]);

    tryUndo();

    expect(historyManager.getUndoStack().length).toBe(0);
    expect(layerManager.readPixelCanvas('layer-1', 0, 0)).toEqual([255, 0, 0, 255]);
  });

  it('keeps an edit that landed on the layer while the move was floating', () => {
    layerManager.registerLayer('layer-1', RED_TOP_LEFT(), 3, 2, { inputSpace: 'canvas' });

    const selection = new SelectionMask(3, 2);
    selection.setFlag({ x: 0, y: 0 }, 1);
    selectionManager.setBack(selection);

    const tool = newMoveTool();
    tool.onStart(args(0, 0));
    tool.onMove(args(1, 0));

    // reach past the guard the way an unguarded path would, so this stays a test of the commit itself:
    // the commit used to compose over the copy taken at startMove, which threw away anything written to
    // the layer in between.
    const layer = layerManager.getLayer('layer-1');
    layer.commitHistory(undefined, { context: { tool: 'clear' } });
    layer.writePixels(new Uint8ClampedArray([0, 255, 0, 255]), { bounds: { x: 2, y: 1, width: 1, height: 1 } });
    expect(layerManager.readPixelCanvas('layer-1', 2, 0)).toEqual([0, 255, 0, 255]);

    floatingMoveManager.commit();

    // the moved pixel landed where it was dragged to...
    expect(layerManager.readPixelCanvas('layer-1', 1, 0)).toEqual([255, 0, 0, 255]);
    // ...and the pixel written while it floated is still there
    expect(layerManager.readPixelCanvas('layer-1', 2, 0)).toEqual([0, 255, 0, 255]);
  });

  it('turns down an effect rather than letting the commit undo it', () => {
    layerManager.registerLayer('layer-1', RED_TOP_LEFT(), 3, 2, { inputSpace: 'canvas' });

    const tool = newMoveTool();
    tool.onStart(args(0, 0));
    tool.onMove(args(1, 1));

    let ran = false;
    applyEffect('layer-1', 'invert', () => {
      ran = true;
    });

    expect(ran).toBe(false);
  });

  it('turns down a layer clear while a move is floating', () => {
    layerManager.registerLayer('layer-1', RED_TOP_LEFT(), 3, 2, { inputSpace: 'canvas' });

    const tool = newMoveTool();
    tool.onStart(args(0, 0));
    tool.onMove(args(1, 1));

    // clearLayer is the entry the keyboard shortcut and the layer panel both reach
    clearLayer('layer-1');

    expect(layerManager.readPixelCanvas('layer-1', 0, 0)).toEqual([255, 0, 0, 255]);
  });

  it('turns down a merge down while a move is floating', () => {
    // the merge composes from the layer textures, so the floating pixels are not in what it writes - and it
    // then removes the layer they were lifted from, which drops the move on the backstop in
    // `LayerRemoveCommand`. the user's move would disappear from the merged result without a word.
    resetStore([buildLayer('layer-1'), buildLayer('layer-2')], { width: 3, height: 2 });
    layerManager.registerLayer('layer-1', RED_TOP_LEFT(), 3, 2, { inputSpace: 'canvas' });
    layerManager.registerLayer('layer-2', new Uint8ClampedArray(3 * 2 * 4), 3, 2, { inputSpace: 'canvas' });

    const tool = newMoveTool();
    tool.onStart(args(0, 0));
    tool.onMove(args(1, 1));
    const entriesBefore = historyManager.getUndoStack().length;

    mergeToBelowLayer('layer-1');

    expect(historyManager.getUndoStack().length).toBe(entriesBefore);
    expect(floatingMoveManager.isMoving()).toBe(true);
  });

  it('comes to rest when the layer it was lifted from is gone', () => {
    layerManager.registerLayer('layer-1', RED_TOP_LEFT(), 3, 2, { inputSpace: 'canvas' });

    const tool = newMoveTool();
    tool.onStart(args(0, 0));
    tool.onMove(args(1, 1));
    expect(floatingMoveManager.isMoving()).toBe(true);

    layerManager.removeLayer('layer-1');

    // the commit used to return before resetting, which left the move floating over a layer that no longer
    // existed - nothing could commit or cancel it again
    floatingMoveManager.commit();

    expect(floatingMoveManager.isMoving()).toBe(false);
    expect(floatingMoveManager.getTargetLayerId()).toBeUndefined();
    expect(floatingMoveManager.getFloatingBuffer()).toBeUndefined();
  });
});
