import { css } from '@acab/ecsstatic';
import { Vec2 } from '@sledge-pdm/core';
import { batch, Component, createSignal, onMount } from 'solid-js';
import CanvasAreaInteract from '~/components/canvas/CanvasAreaInteract';
import { VERBOSE_LOG_ENABLED } from '~/Consts';
import { isBusy } from '~/features/busy';
import CanvasToolOperator, { DrawState } from '~/features/canvas/CanvasToolOperator';
import { getCanvasMousePosition, getWindowMousePosition } from '~/features/canvas/transform/CanvasPositionCalculator';
import { beginEditSession } from '~/features/edit_session';
import { clipboardCopy, clipboardCut } from '~/features/io/clipboard/ClipboardActions';
import { activeLayer } from '~/features/layer';
import { logSystemInfo, logSystemWarn, logUserError } from '~/features/log/service';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { convertSelectionToImage, deleteSelectedArea, invertSelectionArea, isPositionWithinSelection } from '~/features/selection/service';
import { getActiveToolCategory } from '~/features/tools/ToolController';
import { TOOLS_ALLOWED_IN_MOVE_MODE } from '~/features/tools/Tools';
import { interactStore, setInteractStore, toolStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { showContextMenu } from '~/utils/contextMenu';
import { ContextMenuItems } from '~/utils/ContextMenuItems';
import { window as platformWindow, UnlistenFn } from '~/utils/platform';

const strokeArea = css`
  position: absolute;
  touch-action: none;
  pointer-events: all;
  z-index: var(--zindex-interact-area);
`;

// レイヤーごとのキャンバスの上でタッチイベントを受ける領域
export const StrokeCanvas: Component = () => {
  const LOG_LABEL = 'StrokeCanvas';
  const logDebug = (message: string, ...details: unknown[]) => {
    if (VERBOSE_LOG_ENABLED)
      logSystemInfo(message, {
        label: LOG_LABEL,
        details: details.length ? details : undefined,
        debugOnly: true,
      });
  };
  const logDebugWarn = (message: string, ...details: unknown[]) => {
    if (VERBOSE_LOG_ENABLED)
      logSystemWarn(message, {
        label: LOG_LABEL,
        details: details.length ? details : undefined,
        debugOnly: true,
      });
  };

  const operator = new CanvasToolOperator(() => activeLayer().id);

  const [isInStroke, setIsInStroke] = createSignal<boolean>(false);
  const handledPointerDown = new WeakSet<PointerEvent>();

  /** closes the edit session the open gesture holds; undefined while no gesture is open. */
  let endGestureSession: (() => void) | undefined;

  /**
   * @description the tool has taken the pointer. from here until the gesture ends it is holding the pixels
   *   it read at the start, so nothing else may edit them - see `~/features/edit_session`.
   */
  function openGesture() {
    setIsInStroke(true);
    endGestureSession?.();
    endGestureSession = beginEditSession({
      label: 'stroke',
      isExclusive: () => isInStroke(),
      // the pointer is still down and the user is partway through a line. ending it where it is keeps what
      // they drew and gives it a history entry; dropping it would lose a stroke they had already made.
      interrupt: finalizeStroke,
      finalize: finalizeStroke,
    });
  }

  /** @description the gesture is over - by a pointerup, a cancel, or having been finalized from outside. */
  function closeGesture() {
    setIsInStroke(false);
    endGestureSession?.();
    endGestureSession = undefined;
  }

  function isDrawableClick(e: PointerEvent): boolean {
    // an operation holding the window is reading these layers. it also finalized any stroke that was open
    // when it started, so there is nothing here to continue either.
    if (isBusy()) {
      return false;
    }
    if (interactStore.isCanvasSizeFrameMode) {
      return false;
    }
    if (!TOOLS_ALLOWED_IN_MOVE_MODE.includes(toolStore.activeToolCategory) && floatingMoveManager.isMoving()) {
      return false;
    }
    if (e.pointerType === 'touch') return false;

    // 基本的にはCanvasAreaInteractのisDraggableと逆の関係
    if (CanvasAreaInteract.isDraggable(e)) {
      // キャンバスドラッグが有効な場合は描画不可
      return false;
    }

    // マウスおよびペンにおいては右、左クリック相当のクリックだけを描画可能なクリックとする（中クリックは弾く）
    // 右クリックはツールのallowRightClickによってほぼ弾かれる
    if ((e.pointerType === 'mouse' || e.pointerType === 'pen') && e.buttons !== 1 && e.buttons !== 2) {
      return false;
    }

    return true;
  }

  function updatePointerState(e: PointerEvent) {
    const windowPosition = getWindowMousePosition(e);
    const canvasPosition = getCanvasMousePosition(e);
    const onCanvas = isOnCanvas(canvasPosition);
    const onStrokeDetectArea = isPointerOnStrokeDetectArea(e.target);

    batch(() => {
      setInteractStore('lastPointerWindow', windowPosition);
      setInteractStore('lastPointerOnCanvas', canvasPosition);
      setInteractStore('isPointerOnCanvas', onCanvas);
      setInteractStore('isPointerOnStrokeDetectArea', onStrokeDetectArea);
    });

    return { canvasPosition, onCanvas };
  }

  function handlePointerDown(e: PointerEvent) {
    if (handledPointerDown.has(e)) return;
    handledPointerDown.add(e);
    const start = new Date().getTime();
    logDebug(`handlePointerDown start`);
    if (!isDrawableClick(e)) {
      if (interactStore.isCanvasSizeFrameMode) {
        logUserError('quit frame resize mode before draw!', { label: LOG_LABEL });
      }
      if (!TOOLS_ALLOWED_IN_MOVE_MODE.includes(toolStore.activeToolCategory) && floatingMoveManager.isMoving()) {
        logUserError('commit or cancel move mode before draw!', { label: LOG_LABEL });
      }
      logDebugWarn(`handlePointerDown cancelled because not drawable click`);
      return;
    }

    const { canvasPosition } = updatePointerState(e);
    const started = operator.handleDraw(DrawState.start, e, getActiveToolCategory(), canvasPosition);
    if (started) openGesture();
    else closeGesture();
    const end = new Date().getTime();
    logDebug(`handlePointerDown executed in ${end - start} ms`);
  }

  function handlePointerMove(e: PointerEvent) {
    handleMove('move', e);
  }

  function handlePointerRawUpdate(e: PointerEvent) {
    handleMove('rawmove', e);
  }

  function handleMove(type: 'move' | 'rawmove', e: PointerEvent) {
    const fnName = type === 'move' ? 'handlePointerMove' : 'handlePointerRawUpdate';

    const start = new Date().getTime();
    logDebug(`${fnName} start`);

    const { canvasPosition, onCanvas } = updatePointerState(e);

    if (!isDrawableClick(e)) {
      // an operation taking the window gets here, and it already finalized this gesture on its way in, so
      // there is nothing left to end - only the session to let go of.
      closeGesture();
      logDebugWarn(`${fnName} cancelled because not drawable click`);
      return;
    }

    if (onCanvas && !activeLayer().enabled) {
      setInteractStore('strokeAreaCursor', 'not-allowed');
    } else {
      setInteractStore('strokeAreaCursor', 'none');
    }

    if (!isInStroke()) {
      logDebugWarn(`${fnName} cancelled because not in stroke`);
      return;
    }

    operator.handleDraw(type === 'move' ? DrawState.move : DrawState.rawmove, e, getActiveToolCategory(), canvasPosition);

    const end = new Date().getTime();
    logDebug(`${fnName} executed in ${end - start} ms`);
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isInStroke()) return;
    const { canvasPosition } = updatePointerState(e);
    operator.handleDraw(DrawState.end, e, getActiveToolCategory(), canvasPosition);
    closeGesture();
  }

  function handlePointerCancel(e: PointerEvent) {
    if (!isInStroke()) return;
    const { canvasPosition } = updatePointerState(e);
    operator.handleDraw(DrawState.cancel, e, getActiveToolCategory(), canvasPosition);
    closeGesture();
  }

  /**
   * @description end a stroke that is still being drawn, as though the pointer had been lifted where it
   *   last was.
   *
   *   the tool's `onEnd` is what registers the stroke's history entry, so a stroke abandoned rather than
   *   ended would reach the file as pixels with no entry behind them - the image and undo would disagree
   *   the moment the project was reloaded.
   */
  function finalizeStroke() {
    if (!isInStroke()) return;
    operator.handleDraw(DrawState.end, new PointerEvent('pointerup'), getActiveToolCategory(), interactStore.lastPointerOnCanvas);
    closeGesture();
  }

  function isOnCanvas(canvasPosition: Vec2): boolean {
    return (
      canvasPosition.x >= 0 &&
      canvasPosition.y >= 0 &&
      canvasPosition.x <= projectStore.canvas.size.width &&
      canvasPosition.y <= projectStore.canvas.size.height
    );
  }

  let innerArea: HTMLDivElement;
  let outerArea: HTMLDivElement | null = null;
  let unlistenFocusChanged: UnlistenFn | undefined = undefined;

  function isPointerOnStrokeDetectArea(target: EventTarget | null): boolean {
    if (!target || !(target instanceof Node)) return false;
    if (innerArea && innerArea.contains(target)) return true;
    return !!outerArea && outerArea.contains(target);
  }

  onMount(() => {
    outerArea = document.getElementById('outer-stroke-detect-area') as HTMLDivElement | null;

    innerArea!.addEventListener('pointerdown', handlePointerDown);
    outerArea!.addEventListener('pointerdown', handlePointerDown);

    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    // @ts-ignore
    window.addEventListener('pointerrawupdate', handlePointerRawUpdate);
    window.addEventListener('pointercancel', handlePointerCancel);

    platformWindow
      .getCurrentWindow()
      .onFocusChanged(({ payload: focused }) => {
        // an operation's own native dialog taking focus fires this. it already ended whatever stroke was
        // open, and cancelling into its layers now would undo work it has read.
        if (isBusy()) return;
        if (!focused) {
          operator.handleDraw(DrawState.cancel, new PointerEvent('pointercancel'), getActiveToolCategory(), { x: -1, y: -1 });
          closeGesture();
        } else {
          // pipetteのみ復帰時も戻す
          if (toolStore.activeToolCategory === 'pipette')
            operator.handleDraw(DrawState.cancel, new PointerEvent('pointercancel'), getActiveToolCategory(), { x: -1, y: -1 });
        }
      })
      .then((fn) => {
        unlistenFocusChanged = fn;
      });

    return () => {
      // the component is going away with a gesture still open; let go of its session so nothing stays
      // exclusive on behalf of a listener that no longer exists.
      closeGesture();
      innerArea!.removeEventListener('pointerdown', handlePointerDown);
      outerArea!.removeEventListener('pointerdown', handlePointerDown);

      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
      // @ts-ignore
      window.removeEventListener('pointerrawupdate', handlePointerRawUpdate);
      window.removeEventListener('pointercancel', handlePointerCancel);
      unlistenFocusChanged?.();
    };
  });

  return (
    <div
      id='interact-area'
      class={strokeArea}
      ref={(el) => (innerArea = el)}
      style={{
        width: `${projectStore.canvas.size.width}px`,
        height: `${projectStore.canvas.size.height}px`,
        cursor: interactStore.strokeAreaCursor,
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        // every item on this menu edits the project or starts an operation of its own, so the menu itself
        // is not offered while one is running.
        if (isBusy()) return;
        const position = getCanvasMousePosition(e);

        // selection
        if (isPositionWithinSelection(position)) {
          showContextMenu(
            [
              { type: 'label', label: 'selection' },
              {
                ...ContextMenuItems.BaseCopy,
                onSelect: async () => await clipboardCopy(),
              },
              {
                ...ContextMenuItems.BaseCut,
                onSelect: async () => await clipboardCut(),
              },
              {
                ...ContextMenuItems.BaseRemove,
                onSelect: async () => {
                  deleteSelectedArea();
                },
              },
              {
                ...ContextMenuItems.BaseInvertSelection,
                onSelect: async () => {
                  invertSelectionArea();
                },
              },
              {
                ...ContextMenuItems.BaseSelectionConvertToImage,
                onSelect: async () => {
                  await convertSelectionToImage(true);
                },
              },
              {
                ...ContextMenuItems.BaseSelectionCopyAsImage,
                onSelect: async () => {
                  await convertSelectionToImage(false);
                },
              },
            ],
            e
          );
          e.stopImmediatePropagation();
        } else {
          e.stopImmediatePropagation();
        }
      }}
    />
  );
};
