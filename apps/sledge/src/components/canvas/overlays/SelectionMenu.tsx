/**
 * Appearance is 100% OK.
 */

import { Icon } from '@sledge/ui';
import { Component, createEffect, createMemo, createSignal, onMount, Show } from 'solid-js';
import { selectionManager, SelectionState } from '~/features/selection/SelectionAreaManager';
import { cancelMove, cancelSelection, commitMove, deleteSelectedArea, invertSelectionArea } from '~/features/selection/SelectionOperator';
import { eventBus, Events } from '~/utils/EventBus';

import { css } from '@acab/ecsstatic';
import { Vec2 } from '@sledge/core';
import { color } from '@sledge/theme';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { canvasToScreenNoZoom } from '~/features/canvas/CanvasPositionCalculator';
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
  const [updatePosition, setUpdatePosition] = createSignal<boolean>(false);
  const [isRunning, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS((timeStamp) => {
      if (!updatePosition()) return;
      updateMenuPos();
      setUpdatePosition(false);
    }, Number(globalConfig.performance.targetFPS))
  );

  const handleAreaChanged = (e: Events['selection:maskChanged']) => {
    if (e.commit) {
      updateMenuPos();
    } else {
      setUpdatePosition(true);
    }
  };
  const handleMoved = (e: Events['selection:offsetChanged']) => setUpdatePosition(true);
  const handleStateChanged = (e: Events['selection:stateChanged']) => {
    setSelectionState(e.newState);
    setUpdatePosition(true);
  };
  const handleMoveStateChanged = (e: Events['floatingMove:stateChanged']) => {
    setFloatingMoveState(e.moving);
    setUpdatePosition(true);
  };
  const handleRequestMenuUpdate = (e: Events['selection:requestMenuUpdate']) => {
    setUpdatePosition(true);
  };
  onMount(() => {
    startRenderLoop();
    eventBus.on('selection:maskChanged', handleAreaChanged);
    eventBus.on('selection:offsetChanged', handleMoved);
    eventBus.on('selection:stateChanged', handleStateChanged);
    eventBus.on('selection:requestMenuUpdate', handleRequestMenuUpdate);
    eventBus.on('floatingMove:stateChanged', handleMoveStateChanged);

    const observer = new ResizeObserver(() => {
      setUpdatePosition(true);
    });
    const sectionsBetweenArea = document.getElementById('sections-between-area') as HTMLElement;
    if (sectionsBetweenArea) {
      observer.observe(sectionsBetweenArea);
    }

    return () => {
      stopRenderLoop();
      eventBus.off('selection:maskChanged', handleAreaChanged);
      eventBus.off('selection:offsetChanged', handleMoved);
      eventBus.off('selection:stateChanged', handleStateChanged);
      eventBus.off('selection:requestMenuUpdate', handleRequestMenuUpdate);
      eventBus.off('floatingMove:stateChanged', handleMoveStateChanged);
      observer.disconnect();
    };
  });

  createEffect(() => {
    // canvasToScreenNoZoom で実際に使用される値のみ購読
    interactStore.rotation;
    interactStore.offset.x;
    interactStore.offset.y;
    interactStore.horizontalFlipped;
    interactStore.verticalFlipped;
    setUpdatePosition(true);
  });

  const [selectionMenuPos, setSelectionMenuPos] = createSignal<Vec2>({ x: 0, y: 0 });

  const updateMenuPos = () => {
    if (!containerRef) return;
    const outlineBound = selectionManager.getSelectionMask().getBoundBox();
    if (!outlineBound) return;
    const rightBottomOnScreen = canvasToScreenNoZoom({
      x: interactStore.horizontalFlipped ? outlineBound.left : outlineBound.right + 1,
      y: interactStore.verticalFlipped ? outlineBound.top : outlineBound.bottom + 1,
    });
    const containerWidth = containerRef.offsetWidth;
    const containerHeight = containerRef.offsetHeight;
    const anchor = { x: rightBottomOnScreen.x - containerWidth, y: rightBottomOnScreen.y };
    setSelectionMenuPos(anchor);

    // Outer 領域 (sections-between-area) へのクランプ
    const sectionsBetweenArea = document.getElementById('sections-between-area') as HTMLElement;
    if (!sectionsBetweenArea) return;

    const areaRect = sectionsBetweenArea.getBoundingClientRect();
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
        translate: `0px 8px`,
        rotate: `${interactStore.rotation}deg`,
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
