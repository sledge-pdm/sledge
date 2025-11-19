import { css } from '@acab/ecsstatic';
import { Vec2 } from '@sledge/core';
import { showContextMenu } from '@sledge/ui';
import { UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { batch, Component, createSignal, onCleanup, onMount } from 'solid-js';
import CanvasAreaInteract from '~/components/canvas/CanvasAreaInteract';
import { VERBOSE_LOG_ENABLED } from '~/Consts';
import LayerCanvasOperator, { DrawState } from '~/features/canvas/LayerCanvasOperator';
import { getCanvasMousePosition, getWindowMousePosition } from '~/features/canvas/transform/CanvasPositionCalculator';
import { activeLayer } from '~/features/layer';
import { logSystemInfo, logSystemWarn, logUserError } from '~/features/log/service';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { convertSelectionToImage, deleteSelectedArea, invertSelectionArea, isPositionWithinSelection } from '~/features/selection/SelectionOperator';
import { getActiveToolCategory } from '~/features/tools/ToolController';
import { TOOLS_ALLOWED_IN_MOVE_MODE } from '~/features/tools/Tools';
import { interactStore, setInteractStore, toolStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { ContextMenuItems } from '~/utils/ContextMenuItems';
import { eventBus } from '~/utils/EventBus';

const interactArea = css`
  position: absolute;
  touch-action: none;
  pointer-events: all;
  z-index: var(--zindex-interact-area);
`;

// レイヤーごとのキャンバスの上でタッチイベントを受ける領域
export const InteractArea: Component = () => {
  const LOG_LABEL = 'InteractArea';
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

  let areaRef: HTMLDivElement | undefined;

  const operator = new LayerCanvasOperator(() => activeLayer().id);

  const [cursor, setCursor] = createSignal<string>('none');

  const [lastPos, setLastPos] = createSignal<Vec2 | undefined>(undefined);
  const [temporaryOut, setTemporaryOut] = createSignal(false);

  function isDrawableClick(e: PointerEvent): boolean {
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

  function handleOutCanvasAreaPointerDown(e: PointerEvent) {
    const start = new Date().getTime();
    logDebug(`handleOutCanvasAreaPointerDown start`);
    const activeToolCategory = getActiveToolCategory();
    if (!activeToolCategory.behavior.acceptStartOnOutCanvas) {
      logDebugWarn(`handleOutCanvasAreaPointerDown cancelled because tool doesn't accept it`);
      return;
    }
    if (!isDrawableClick(e)) {
      if (interactStore.isCanvasSizeFrameMode) {
        logUserError('quit frame resize mode first!', { label: LOG_LABEL });
      }
      if (!TOOLS_ALLOWED_IN_MOVE_MODE.includes(toolStore.activeToolCategory) && floatingMoveManager.isMoving()) {
        logUserError('commit or cancel move first!', { label: LOG_LABEL });
      }
      logDebugWarn(`handleOutCanvasAreaPointerDown cancelled because not drawable click`);
      return;
    }

    e.stopPropagation();
    e.stopImmediatePropagation();

    const position = getCanvasMousePosition(e);
    // ! note that PointerEvent is the event on CanvasArea (not on InteractCanvas)
    //   This may cause unexpected behavior if the tool use element-specific values.
    operator.handleDraw(DrawState.start, e, activeToolCategory, position, lastPos());
    setInteractStore('isInStroke', true);
    setLastPos(position);
    const end = new Date().getTime();
    logDebug(`handleOutCanvasAreaPointerDown executed in ${end - start} ms`);
  }

  function handlePointerDown(e: PointerEvent) {
    const start = new Date().getTime();
    logDebug(`handlePointerDown start`);
    if (!isDrawableClick(e)) {
      if (interactStore.isCanvasSizeFrameMode) {
        logUserError('quit frame resize mode first!', { label: LOG_LABEL });
      }
      if (!TOOLS_ALLOWED_IN_MOVE_MODE.includes(toolStore.activeToolCategory) && floatingMoveManager.isMoving()) {
        logUserError('commit or cancel move first!', { label: LOG_LABEL });
      }
      logDebugWarn(`handlePointerDown cancelled because not drawable click`);
      return;
    }

    const position = getCanvasMousePosition(e);
    operator.handleDraw(DrawState.start, e, getActiveToolCategory(), position, lastPos());
    setInteractStore('isInStroke', true);
    setLastPos(position);
    const end = new Date().getTime();
    logDebug(`handlePointerDown executed in ${end - start} ms`);
  }

  function handlePointerCancel(e: PointerEvent) {
    const position = getCanvasMousePosition(e);
    setInteractStore('isMouseOnCanvas', false);
    operator.handleDraw(DrawState.cancel, e, getActiveToolCategory(), position, lastPos());
    endStroke(getCanvasMousePosition(e));
  }

  function handlePointerMove(e: PointerEvent) {
    const start = new Date().getTime();
    logDebug(`handlePointerMove start`);

    const windowPosition = getWindowMousePosition(e);
    const position = getCanvasMousePosition(e);
    const onCanvas = !!areaRef?.contains(e.target as Node);

    batch(() => {
      setInteractStore('lastMouseWindow', windowPosition);
      setInteractStore('lastMouseOnCanvas', position);
      setInteractStore('isMouseOnCanvas', onCanvas);
    });

    if (!isDrawableClick(e)) {
      logDebugWarn(`handlePointerMove cancelled because not drawable click`);
      return;
    }

    if (onCanvas && !activeLayer().enabled) {
      setCursor('not-allowed');
    } else {
      setCursor('none');
    }

    // 押したまま外に出てから戻ってきたときはそこから再開
    if (temporaryOut()) {
      setTemporaryOut(false);
      setInteractStore('isInStroke', true);
      setLastPos(position);
    }

    if (!interactStore.isInStroke || !lastPos()) {
      logDebugWarn(`handlePointerMove cancelled because not in stroke or no last position`);
      return;
    }

    operator.handleDraw(DrawState.move, e, getActiveToolCategory(), position, lastPos());
    setLastPos(position);
    const end = new Date().getTime();
    logDebug(`handlePointerMove executed in ${end - start} ms`);
  }

  function handlePointerUp(e: PointerEvent) {
    const position = getCanvasMousePosition(e);
    operator.handleDraw(DrawState.end, e, getActiveToolCategory(), position, lastPos());
    endStroke(position);
  }

  function handlePointerOut(e: PointerEvent) {
    // 出た時点でストロークを切る場合
    // const position = getCanvasMousePosition(e);
    // if (interactStore.isInStroke) endStroke(position);
    setInteractStore('isMouseOnCanvas', false);

    // 出た時点でも押したままキャンバス内に戻ってきたらストロークを再開する場合
    if (interactStore.isDragging && isDrawableClick(e)) {
      const position = getCanvasMousePosition(e);
      operator.handleDraw(DrawState.move, e, getActiveToolCategory(), position, lastPos());
      setTemporaryOut(true);
    }
  }

  function endStroke(position: Vec2) {
    setInteractStore('isInStroke', false);
    setLastPos(undefined);
    setTemporaryOut(false);
  }

  let unlistenFocusChanged: UnlistenFn | undefined = undefined;

  onMount(() => {
    const outCanvasArea = document.getElementById('out-canvas-area');
    outCanvasArea!.addEventListener('pointerdown', handleOutCanvasAreaPointerDown);
    areaRef!.addEventListener('pointerdown', handlePointerDown);
    areaRef!.addEventListener('pointerout', handlePointerOut);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointercancel', handlePointerCancel);

    getCurrentWindow()
      .onFocusChanged(({ payload: focused }) => {
        if (!focused) {
          operator.handleDraw(DrawState.cancel, new PointerEvent('pointercancel'), getActiveToolCategory(), { x: -1, y: -1 }, lastPos());
        } else {
          // pipetteのみ復帰時も戻す
          if (toolStore.activeToolCategory === 'pipette')
            operator.handleDraw(DrawState.cancel, new PointerEvent('pointercancel'), getActiveToolCategory(), { x: -1, y: -1 }, lastPos());
        }
      })
      .then((fn) => {
        unlistenFocusChanged = fn;
      });

    return () => {
      outCanvasArea!.removeEventListener('pointerdown', handleOutCanvasAreaPointerDown);
      areaRef!.removeEventListener('pointerdown', handlePointerDown);
      areaRef!.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  });

  onCleanup(() => {
    unlistenFocusChanged?.();
  });

  return (
    <div
      id='interact-area'
      class={interactArea}
      ref={(el) => {
        areaRef = el;
      }}
      style={{
        width: `${canvasStore.canvas.width}px`,
        height: `${canvasStore.canvas.height}px`,
        cursor: cursor(),
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        const position = getCanvasMousePosition(e);

        // selection
        if (isPositionWithinSelection(position)) {
          showContextMenu(
            [
              { type: 'label', label: 'selection' },
              {
                ...ContextMenuItems.BaseCopy,
                onSelect: async () => {
                  eventBus.emit('clipboard:doCopy', {});
                },
              },
              {
                ...ContextMenuItems.BaseCut,
                onSelect: async () => {
                  eventBus.emit('clipboard:doCut', {});
                },
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
