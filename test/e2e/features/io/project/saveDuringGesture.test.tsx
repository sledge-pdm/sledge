import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StrokeCanvas } from '~/components/canvas/canvas/StrokeCanvas';
import { OnCanvasFrameInteract } from '~/components/canvas/overlays/OnCanvasFrameInteract';
import LayerListPropsRow from '~/components/section/editor/layer/row/LayerListPropsRow';
import { finalizeEditSessions } from '~/features/edit_session';
import { historyManager } from '~/features/history';
import { ProjectLoader } from '~/features/io/project/ProjectLoader';
import { saveProject } from '~/features/io/project/ProjectSave';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { CURRENT_PROJECT_VERSION } from '~/features/project/Consts';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import { setActiveToolCategory } from '~/features/tools/ToolController';
import { setIOStore, toolStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { unpackFromBytes } from '~/utils/msgpackr';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../../history/helpers';

const SIZE = 16;

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));
const sameBytes = (actual: Uint8Array, expected: Uint8Array) => expect(Array.from(actual)).toEqual(Array.from(expected));

/**
 * a save can be asked for from anywhere, including with the pointer still down. what it reads has to be a
 * committed state: the gesture ended where the pointer last was, and its history entry registered - or the
 * file would hold pixels that the history in that same file cannot walk back through.
 */
describe('io/project/save started mid-gesture (e2e)', () => {
  let platform: TestMockPlatform;
  let written: Uint8Array | undefined;
  let dispose: (() => void) | undefined;
  let root: HTMLDivElement;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    platform.core.isTauri = vi.fn(() => true) as any;

    setupWebGL();
    const layers = [buildLayer('a')];
    resetStore(layers, { width: SIZE, height: SIZE });
    registerLayers(layers, SIZE, SIZE);
    historyManager.clearHistory();

    setIOStore('openAs', 'project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    setIOStore('loadProjectVersion', { project: CURRENT_PROJECT_VERSION, sledge: '1.0.0' });
    setIOStore('recentFiles', []);
    setProjectStore('snapshots', []);

    written = undefined;
    platform.dialog.save = vi.fn(async () => 'C:/work/demo.sledge') as any;
    platform.dialog.confirm = vi.fn(async () => true) as any;
    platform.fs.writeFile = vi.fn(async (_path: string, data: Uint8Array) => {
      written = data;
    }) as any;
    platform.fs.exists = vi.fn(async () => false) as any;
    platform.fs.mkdir = vi.fn(async () => undefined) as any;
    platform.fs.rename = vi.fn(async () => undefined) as any;
    platform.fs.remove = vi.fn(async () => undefined) as any;
    platform.path.appDataDir = vi.fn(async () => 'C:/AppData') as any;
    platform.app.getVersion = vi.fn(async () => '1.2.3') as any;

    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    document.body.innerHTML = '';
  });

  const pointer = (type: string, x: number, y: number, extra?: PointerEventInit) =>
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
      ...extra,
    });

  describe('with a stroke still being drawn', () => {
    /** @description the DOM StrokeCanvas expects around it: it reads the outer area out of the document. */
    const mountStrokeCanvas = () => {
      const outer = document.createElement('div');
      outer.id = 'outer-stroke-detect-area';
      root.appendChild(outer);
      dispose = render(() => <StrokeCanvas />, root);
      return root.querySelector('#interact-area') as HTMLDivElement;
    };

    it('ends the stroke and registers its history before reading anything', async () => {
      setActiveToolCategory('pen');
      const area = mountStrokeCanvas();

      // a real press and drag, left where it is - no pointerup
      area.dispatchEvent(pointer('pointerdown', 2, 2));
      window.dispatchEvent(pointer('pointermove', 6, 6));
      await settled();

      expect(historyManager.getUndoStack()).toHaveLength(0);

      expect(await saveProject('demo.sledge', 'C:/work')).toBe('saved');

      // the stroke is closed and in history, rather than still open with its pixels already in the file
      expect(historyManager.getUndoStack().length).toBeGreaterThan(0);
      expect(written).toBeDefined();
    });

    it('writes a file whose image and history agree after a reload', async () => {
      setActiveToolCategory('pen');
      const area = mountStrokeCanvas();

      const layer = layerManager.getLayer('a');
      const blank = layer.readPixels();

      area.dispatchEvent(pointer('pointerdown', 3, 3));
      window.dispatchEvent(pointer('pointermove', 9, 9));
      await settled();

      expect(await saveProject('demo.sledge', 'C:/work')).toBe('saved');
      const drawn = layerManager.getLayer('a').readPixels();
      // the stroke actually put something down, so the comparisons below mean something
      expect(Array.from(drawn)).not.toEqual(Array.from(blank));

      const project = unpackFromBytes(written!);
      expect(await ProjectLoader.fromProjectObj({ project }).load()).toMatchObject({ ok: true });

      const reloaded = layerManager.getLayer('a');
      sameBytes(reloaded.readPixels(), drawn);

      // the entry the stroke registered came through the file, so undo walks back to before the stroke
      reloaded.undo();
      sameBytes(reloaded.readPixels(), blank);
      reloaded.redo();
      sameBytes(reloaded.readPixels(), drawn);
    });

    it('refuses to start a new stroke while the save is running', async () => {
      setActiveToolCategory('pen');
      const area = mountStrokeCanvas();

      let releaseWrite: (() => void) | undefined;
      const writeGate = new Promise<void>((resolve) => (releaseWrite = resolve));
      platform.fs.writeFile = vi.fn(async () => {
        await writeGate;
      }) as any;

      const saving = saveProject('demo.sledge', 'C:/work');
      await settled();

      const before = layerManager.getLayer('a').readPixels();
      area.dispatchEvent(pointer('pointerdown', 4, 4));
      window.dispatchEvent(pointer('pointermove', 11, 11));
      await settled();

      // the layers a save is reading are not drawn into
      sameBytes(layerManager.getLayer('a').readPixels(), before);

      releaseWrite!();
      await expect(saving).resolves.toBe('saved');
    });
  });

  describe('with a move still floating', () => {
    afterEach(() => {
      floatingMoveManager.cancel();
      selectionManager.clearAll();
    });

    /** @description lift the whole layer and drag it, leaving it floating the way the UI does. */
    const startFloatingMove = () => {
      setActiveToolCategory('move');
      const tool = new (
        toolStore.tools.move.behavior.constructor as new () => {
          onStart: (args: any) => unknown;
          onMove: (args: any) => unknown;
        }
      )();
      const at = (x: number, y: number) => ({ layerId: 'a', rawPosition: { x, y }, position: { x, y }, color: [0, 0, 0, 255] });
      tool.onStart(at(2, 2));
      tool.onMove(at(6, 5));
    };

    it('commits it, so the file holds what the user can see', async () => {
      const layer = layerManager.getLayer('a');
      // something to move: without it, committing and not committing look identical
      layer.writePixels(new Uint8ClampedArray([255, 0, 0, 255]), { bounds: { x: 1, y: 1, width: 1, height: 1 } });
      const beforeMove = layer.readPixels();

      startFloatingMove();
      expect(floatingMoveManager.isMoving()).toBe(true);
      // the floating pixels live in an overlay, so the layer itself has not changed yet
      sameBytes(layerManager.getLayer('a').readPixels(), beforeMove);

      expect(await saveProject('demo.sledge', 'C:/work')).toBe('saved');

      // the move was applied before the bytes were assembled, rather than being left floating over a file
      // that was written without it
      expect(floatingMoveManager.isMoving()).toBe(false);
      const committed = layerManager.getLayer('a').readPixels();
      expect(Array.from(committed)).not.toEqual(Array.from(beforeMove));

      const project = unpackFromBytes(written!);
      expect(await ProjectLoader.fromProjectObj({ project }).load()).toMatchObject({ ok: true });
      sameBytes(layerManager.getLayer('a').readPixels(), committed);
    });
  });

  describe('with a transform still under the pointer', () => {
    it('commits it and gives the pointer back', () => {
      const frameRoot = document.createElement('div');
      root.appendChild(frameRoot);
      frameRoot.classList.add('drag-surface');

      let rect = { x: 0, y: 0, width: 8, height: 8, rotation: 0 };
      const onCommit = vi.fn();
      const interact = new OnCanvasFrameInteract(frameRoot, () => rect, {
        keepAspect: 'none',
        snapToPixel: false,
        allowInvert: false,
        onChange: (changed) => (rect = changed),
        onCommit,
      });
      interact.setInteractListeners();

      try {
        frameRoot.dispatchEvent(pointer('pointerdown', 10, 10));
        frameRoot.dispatchEvent(pointer('pointermove', 24, 18));
        expect(onCommit).not.toHaveBeenCalled();

        finalizeEditSessions();

        // committed at the position it last reached, which is where the owner registers its history entry
        expect(onCommit).toHaveBeenCalledTimes(1);
        expect(frameRoot.hasPointerCapture(1)).toBe(false);

        // and the gesture is over: the pointerup that eventually arrives does not commit a second time
        frameRoot.dispatchEvent(pointer('pointerup', 24, 18));
        expect(onCommit).toHaveBeenCalledTimes(1);
      } finally {
        interact.removeInteractListeners();
      }
    });

    it('starts no new transform while an operation is running', async () => {
      const frameRoot = document.createElement('div');
      frameRoot.classList.add('drag-surface');
      root.appendChild(frameRoot);

      const onStart = vi.fn();
      const interact = new OnCanvasFrameInteract(frameRoot, () => ({ x: 0, y: 0, width: 8, height: 8, rotation: 0 }), {
        keepAspect: 'none',
        snapToPixel: false,
        allowInvert: false,
        onStart,
      });
      interact.setInteractListeners();

      let releaseWrite: (() => void) | undefined;
      const writeGate = new Promise<void>((resolve) => (releaseWrite = resolve));
      platform.fs.writeFile = vi.fn(async () => {
        await writeGate;
      }) as any;

      try {
        const saving = saveProject('demo.sledge', 'C:/work');
        await settled();

        frameRoot.dispatchEvent(pointer('pointerdown', 10, 10));
        expect(onStart).not.toHaveBeenCalled();

        releaseWrite!();
        await expect(saving).resolves.toBe('saved');
      } finally {
        interact.removeInteractListeners();
      }
    });
  });

  describe('with an opacity change still waiting on its timer', () => {
    it('registers the entry rather than leaving it to the timer', async () => {
      dispose = render(() => <LayerListPropsRow />, root);
      const slider = root.querySelector('.slider') as HTMLElement;
      expect(slider).toBeTruthy();

      const rect = slider.getBoundingClientRect();
      slider.dispatchEvent(pointer('pointerdown', rect.left + rect.width / 2, rect.top + rect.height / 2));
      document.dispatchEvent(pointer('pointermove', rect.left + rect.width * 0.25, rect.top + rect.height / 2));
      await settled();

      const changedOpacity = projectStore.layers.layers[0].opacity;
      expect(changedOpacity).toBeLessThan(1);
      // the 200ms has not elapsed: the layer already has the new opacity, history has nothing
      expect(historyManager.getUndoStack()).toHaveLength(0);

      expect(await saveProject('demo.sledge', 'C:/work')).toBe('saved');

      // the entry is in before the save reads, so the file's opacity and its history describe one state
      expect(historyManager.getUndoStack()).toHaveLength(1);
      const project = unpackFromBytes(written!);
      expect(project.layers.layers[0].opacity).toBeCloseTo(changedOpacity, 5);
      expect(project.history.undoStack.length).toBe(1);
    });

    it('does not register it twice when the timer would have fired anyway', async () => {
      dispose = render(() => <LayerListPropsRow />, root);
      const slider = root.querySelector('.slider') as HTMLElement;
      const rect = slider.getBoundingClientRect();

      slider.dispatchEvent(pointer('pointerdown', rect.left + rect.width / 2, rect.top + rect.height / 2));
      document.dispatchEvent(pointer('pointermove', rect.left + rect.width * 0.25, rect.top + rect.height / 2));
      await settled();

      expect(await saveProject('demo.sledge', 'C:/work')).toBe('saved');
      expect(historyManager.getUndoStack()).toHaveLength(1);

      // well past the 200ms the finalizer cancelled
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(historyManager.getUndoStack()).toHaveLength(1);
    });
  });
});
