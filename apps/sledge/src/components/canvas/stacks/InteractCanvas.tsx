import { css } from '@acab/ecsstatic';
import { Vec2 } from '@sledge/core';
import { showContextMenu } from '@sledge/ui';
import { UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { batch, Component, createSignal, onMount } from 'solid-js';
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

  const operator = new LayerCanvasOperator(() => activeLayer().id);

  const [cursor, setCursor] = createSignal<string>('none');

  const [isInStroke, setIsInStroke] = createSignal<boolean>(false);
  const [lastPos, setLastPos] = createSignal<Vec2 | undefined>(undefined);

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

  function handleWindowPointerDown(e: PointerEvent) {
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

    const activeToolCategory = getActiveToolCategory();
    e.stopPropagation();
    e.stopImmediatePropagation();

    setIsInStroke(true);

    const position = getCanvasMousePosition(e);
    operator.handleDraw(DrawState.start, e, getActiveToolCategory(), position, lastPos());
    setLastPos(position);
    const end = new Date().getTime();
    logDebug(`handlePointerDown executed in ${end - start} ms`);
  }

  function handlePointerCancel(e: PointerEvent) {
    const position = getCanvasMousePosition(e);
    setInteractStore('isMouseOnCanvas', false);
    operator.handleDraw(DrawState.cancel, e, getActiveToolCategory(), position, lastPos());
  }

  function handlePointerMove(e: PointerEvent) {
    const start = new Date().getTime();
    logDebug(`handlePointerMove start`);

    const windowPosition = getWindowMousePosition(e);
    const canvasPosition = getCanvasMousePosition(e);
    const onCanvas = isOnCanvas(canvasPosition);

    batch(() => {
      setInteractStore('lastMouseWindow', windowPosition);
      setInteractStore('lastMouseOnCanvas', canvasPosition);
      setInteractStore('isMouseOnCanvas', onCanvas);
    });

    if (!isDrawableClick(e)) {
      setIsInStroke(false);
      logDebugWarn(`handlePointerMove cancelled because not drawable click`);
      return;
    }

    if (onCanvas && !activeLayer().enabled) {
      setCursor('not-allowed');
    } else {
      setCursor('none');
    }

    setLastPos(canvasPosition);

    if (!isInStroke() || !lastPos()) {
      logDebugWarn(`handlePointerMove cancelled because not in stroke or no last position`);
      return;
    }

    operator.handleDraw(DrawState.move, e, getActiveToolCategory(), canvasPosition, lastPos());
    setLastPos(canvasPosition);
    const end = new Date().getTime();
    logDebug(`handlePointerMove executed in ${end - start} ms`);
  }

  function handlePointerUp(e: PointerEvent) {
    const position = getCanvasMousePosition(e);
    operator.handleDraw(DrawState.end, e, getActiveToolCategory(), position, lastPos());
    setIsInStroke(false);
  }

  function isOnCanvas(canvasPosition: Vec2): boolean {
    return (
      canvasPosition.x >= 0 && canvasPosition.y >= 0 && canvasPosition.x <= canvasStore.canvas.width && canvasPosition.y <= canvasStore.canvas.height
    );
  }

  let unlistenFocusChanged: UnlistenFn | undefined = undefined;

  onMount(() => {
    window.addEventListener('pointerdown', handleWindowPointerDown);
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
      window.removeEventListener('pointerdown', handleWindowPointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointercancel', handlePointerCancel);
      unlistenFocusChanged?.();
    };
  });

  return (
    <div
      id='interact-area'
      class={interactArea}
      style={{
        width: `${canvasStore.canvas.width}px`,
        height: `${canvasStore.canvas.height}px`,
        cursor: cursor(),
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
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
