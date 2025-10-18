/**
 * Appearance is 100% OK.
 */

import { Icon } from '@sledge/ui';
import { Component, createEffect, createMemo, createSignal, onMount, Show } from 'solid-js';
import { selectionManager, SelectionState } from '~/features/selection/SelectionAreaManager';
import {
  cancelMove,
  cancelSelection,
  commitMove,
  deleteSelectedArea,
  invertSelectionArea,
  isSelectionAvailable,
} from '~/features/selection/SelectionOperator';
import { eventBus, Events } from '~/utils/EventBus';

import { css } from '@acab/ecsstatic';
import { Vec2 } from '@sledge/core';
import { color } from '@sledge/theme';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { canvasToScreenNoZoom } from '~/features/canvas/CanvasPositionCalculator';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';

const container = css`
  display: flex;
  flex-direction: row;
  border: 1px solid var(--color-on-background);
  background-color: var(--color-surface);
  pointer-events: all;
  z-index: var(--zindex-canvas-overlay);
`;

const item = css`
  display: flex;
  flex-direction: row;
  box-sizing: content-box;
  align-items: center;
  pointer-events: all;
  cursor: pointer;
  padding: 6px;
  gap: 6px;
  background-color: var(--color-surface);
  &:hover {
    filter: brightness(0.85);
  }
`;

const divider = css`
  display: flex;
  flex-direction: row;
  width: 1px;
  margin-top: 4px;
  margin-bottom: 4px;
  box-sizing: content-box;
  background-color: var(--color-muted);
`;

interface ItemProps {
  src: string;
  label?: string;
  title?: string;
  onClick?: () => void;
}

const Item: Component<ItemProps> = (props) => {
  return (
    <div class={item} onClick={props.onClick} title={props.title}>
      <Icon src={props.src} color={color.onBackground} base={10} />
      <Show when={props.label}>
        <p>{props.label}</p>
      </Show>
    </div>
  );
};

const Divider: Component = () => {
  return <div class={divider} />;
};

const [selectionState, setSelectionState] = createSignal<SelectionState>(selectionManager.getState());
const [floatingMoveState, setFloatingMoveState] = createSignal<boolean>(false);

const [outerPosition, setOuterPosition] = createSignal<Vec2 | undefined>(undefined);

export const OnCanvasSelectionMenu: Component<{}> = (props) => {
  let containerRef: HTMLDivElement;
  let sectionsBetweenAreaRef: HTMLElement | null = null;
  const [updatePosition, setUpdatePosition] = createSignal<boolean>(false);
  const [isRunning, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS((timeStamp) => {
      if (!updatePosition()) return;
      updateMenuPos();
      setUpdatePosition(false);
    }, Number(globalConfig.performance.targetFPS))
  );

  // Move handleUpdate outside the component to keep its reference stable
  const handleUpdate = (e: Events['selection:updateSelectionMenu']) => {
    setSelectionState(selectionManager.getState());
    setFloatingMoveState(floatingMoveManager.isMoving());
    if (e.immediate) {
      updateMenuPos();
    } else {
      setUpdatePosition(true);
    }
  };
  onMount(() => {
    startRenderLoop();
    eventBus.on('selection:updateSelectionMenu', handleUpdate);

    const observer = new ResizeObserver(() => {
      setUpdatePosition(true);
    });
    sectionsBetweenAreaRef = document.getElementById('sections-between-area') as HTMLElement;
    if (sectionsBetweenAreaRef) {
      observer.observe(sectionsBetweenAreaRef);
    }

    return () => {
      stopRenderLoop();
      eventBus.off('selection:updateSelectionMenu', handleUpdate);
      observer.disconnect();
    };
  });

  // 座標変換に影響する要素を監視
  createEffect(() => {
    interactStore.rotation;
    interactStore.horizontalFlipped;
    interactStore.verticalFlipped;
    setUpdatePosition(true);
  });

  // 平行移動のみを監視（頻度が高いため分離）
  createEffect(() => {
    interactStore.offset.x;
    interactStore.offset.y;
    setUpdatePosition(true);
  });

  const [selectionMenuPos, setSelectionMenuPos] = createSignal<Vec2>({ x: 0, y: 0 });

  const updateMenuPos = () => {
    if (!isSelectionAvailable()) return;

    if (!containerRef) return;
    const boundbox = selectionManager.getSelectionMask().getBoundBox();
    if (!boundbox) return;
    const width = boundbox.right - boundbox.left + 1;
    const height = boundbox.bottom - boundbox.top + 1;
    const movingOffset = floatingMoveManager.isMoving() ? floatingMoveManager.getFloatingBuffer()!.offset : { x: 0, y: 0 };
    const offset = {
      x: boundbox.left + movingOffset.x,
      y: boundbox.top + movingOffset.y,
    };

    const left = offset.x;
    const top = offset.y;
    const right = left + width;
    const bottom = top + height;

    const rightBottomOnScreen = canvasToScreenNoZoom({
      x: interactStore.horizontalFlipped ? left : right,
      y: interactStore.verticalFlipped ? top : bottom,
    });
    const containerWidth = containerRef.offsetWidth;
    const containerHeight = containerRef.offsetHeight;
    const anchor = { x: rightBottomOnScreen.x - containerWidth, y: rightBottomOnScreen.y };
    setSelectionMenuPos(anchor);

    // Outer 領域 (sections-between-area) へのクランプ
    if (!sectionsBetweenAreaRef) return;

    const areaRect = sectionsBetweenAreaRef.getBoundingClientRect();
    const containerRect = containerRef.getBoundingClientRect();
    const outerMargin = 8;
    const clampedX = Math.max(areaRect.left + outerMargin, Math.min(containerRect.x, areaRect.right - containerWidth - outerMargin));
    const clampedY = Math.max(areaRect.top + outerMargin, Math.min(containerRect.y, areaRect.bottom - containerHeight - outerMargin));

    if (clampedX !== containerRect.x || clampedY !== containerRect.y) {
      setOuterPosition({ x: clampedX - areaRect.left, y: clampedY - areaRect.top });
    } else {
      setOuterPosition(undefined);
    }
  };

  const visibility = createMemo(() => {
    // idle状態の場合は表示しない
    if (selectionState() === 'idle') return 'collapse';
    // 外側メニューがある場合は表示しない
    if (outerPosition() !== undefined) return 'collapse';
    // キャンバスをリサイズ中の場合は表示しない
    if (interactStore.isCanvasSizeFrameMode) return 'collapse';
    return 'visible';
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: `${selectionMenuPos().x}px`,
        top: `${selectionMenuPos().y}px`,
        visibility: visibility(),
        'pointer-events': 'all',
        'transform-origin': '100% 0',
        transform: `rotate(${interactStore.rotation}deg) translateY(8px)`,
        'z-index': 'var(--zindex-canvas-overlay)',
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }}
    >
      <div ref={(ref) => (containerRef = ref)} class={container}>
        {MenuContent()}
      </div>
    </div>
  );
};

export const OuterSelectionMenu: Component<{}> = (props) => {
  const visibility = createMemo(() => {
    // idle状態の場合は表示しない
    if (selectionState() === 'idle') return 'collapse';
    // 外側メニューの座標がない場合は表示しない
    if (outerPosition() === undefined) return 'collapse';
    // キャンバスをリサイズ中の場合は表示しない
    if (interactStore.isCanvasSizeFrameMode) return 'collapse';

    return 'visible';
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: `${outerPosition()?.x ?? 0}px`,
        top: `${outerPosition()?.y ?? 0}px`,
        opacity: 0.8,
        'pointer-events': 'all',
        'z-index': 'var(--zindex-canvas-overlay)',
        visibility: visibility(),
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }}
    >
      <div class={container}>{MenuContent()}</div>
    </div>
  );
};

const MenuContent = () => {
  return (
    <>
      <Show when={floatingMoveState()}>
        <Item
          src='/icons/selection/commit_10.png'
          onClick={() => {
            commitMove();
          }}
          label='commit.'
          title='commit.'
        />
        <Divider />
        <Item
          src='/icons/selection/cancel_10.png'
          onClick={() => {
            cancelMove();
            cancelSelection();
          }}
          label='cancel.'
          title='cancel.'
        />
      </Show>
      <Show when={!floatingMoveState()}>
        <Item
          src='/icons/selection/cancel_10.png'
          onClick={() => {
            cancelSelection();
          }}
          label='cancel.'
          title='cancel.'
        />
        <Divider />
        <Item
          src='/icons/selection/invert_10.png'
          onClick={() => {
            invertSelectionArea();
          }}
          title='invert.'
        />
        <Divider />
        <Item
          src='/icons/selection/delete_10.png'
          onClick={() => {
            deleteSelectedArea();
          }}
          title='delete.'
        />
      </Show>
    </>
  );
};
