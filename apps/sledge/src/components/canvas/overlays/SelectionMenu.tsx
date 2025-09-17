import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component, createEffect, createSignal, onMount, Show } from 'solid-js';
import { selectionManager, SelectionState } from '~/features/selection/SelectionAreaManager';
import {
  cancelMove,
  cancelSelection,
  commitMove,
  deletePixelInSelection,
  getSelectionOffset,
  invertSelectionArea,
} from '~/features/selection/SelectionOperator';
import { eventBus, Events } from '~/utils/EventBus';

import { Vec2 } from '@sledge/core';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Consts } from '~/Consts';
import { canvasToScreenNoZoom } from '~/features/canvas/CanvasPositionCalculator';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { container, divider, item } from '~/styles/components/canvas/overlays/selection_menu.css';

interface ItemProps {
  src: string;
  label?: string;
  title?: string;
  onClick?: () => void;
}

const Item: Component<ItemProps> = (props) => {
  return (
    <div class={item} onClick={props.onClick} title={props.title}>
      <Icon src={props.src} color={vars.color.onBackground} base={10} />
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
    }
    setUpdatePosition(true);
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

    const observer = new ResizeObserver((entries) => {
      entries.forEach((el) => {
        setUpdatePosition(true);
      });
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
    // 位置に影響し得る要素を購読
    interactStore.zoom; // zoom が変われば位置再計算 (ズームで位置は動くがメニュー自体はスケールしない)
    interactStore.rotation;
    interactStore.offset.x;
    interactStore.offset.y;
    interactStore.horizontalFlipped;
    interactStore.verticalFlipped;
    setUpdatePosition(true);
  });

  const [selectionMenuPos, setSelectionMenuPos] = createSignal<Vec2>({ x: 0, y: 0 });

  const updateMenuPos = () => {
    const outlineBound = selectionManager.getSelectionMask().getBoundBox();
    if (!outlineBound) return;
    const selectionOffset = getSelectionOffset();

    // 選択領域の4隅 (右+1, 下+1 を含めてピクセル境界の外側を含む) を列挙し、回転/flip/zoom 後の見かけ上の AABB を screen 上で取得
    const cornersCanvas: Vec2[] = [
      { x: outlineBound.left, y: outlineBound.top },
      { x: outlineBound.right + 1, y: outlineBound.top },
      { x: outlineBound.right + 1, y: outlineBound.bottom + 1 },
      { x: outlineBound.left, y: outlineBound.bottom + 1 },
    ].map((c) => ({ x: c.x + selectionOffset.x, y: c.y + selectionOffset.y }));

    const cornersScreen = cornersCanvas.map((c) => canvasToScreenNoZoom(c));
    const minX = Math.min(...cornersScreen.map((c) => c.x));
    const minY = Math.min(...cornersScreen.map((c) => c.y));
    const maxX = Math.max(...cornersScreen.map((c) => c.x));
    const maxY = Math.max(...cornersScreen.map((c) => c.y));

    const containerWidth = containerRef?.offsetWidth ?? 0;

    const margin = 8;
    const anchor = { x: maxX - containerWidth, y: maxY + margin };
    setSelectionMenuPos(anchor);

    // Outer 領域 (sections-between-area) へのクランプ
    const sectionsBetweenArea = document.getElementById('sections-between-area') as HTMLElement;
    if (sectionsBetweenArea && containerRef) {
      const areaRect = sectionsBetweenArea.getBoundingClientRect();
      const menuW = containerRef.offsetWidth;
      const menuH = containerRef.offsetHeight;
      const outerMargin = 8;
      let clampedX = anchor.x;
      let clampedY = anchor.y;
      if (clampedX > areaRect.right - outerMargin - menuW) clampedX = areaRect.right - outerMargin - menuW;
      if (clampedY > areaRect.bottom - outerMargin - menuH) clampedY = areaRect.bottom - outerMargin - menuH;
      if (clampedX < areaRect.left + outerMargin) clampedX = areaRect.left + outerMargin;
      if (clampedY < areaRect.top + outerMargin) clampedY = areaRect.top + outerMargin;
      if (clampedX !== anchor.x || clampedY !== anchor.y) {
        setOuterPosition({ x: clampedX - areaRect.left, y: clampedY - areaRect.top });
      } else {
        setOuterPosition(undefined);
      }
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${selectionMenuPos().x}px`,
        top: `${selectionMenuPos().y}px`,
        visibility: outerPosition() === undefined && selectionState() !== 'idle' ? 'visible' : 'collapse',
        'pointer-events': 'all',
        'transform-origin': '0 0',
        'z-index': Consts.zIndex.canvasOverlay,
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
  return (
    <div
      style={{
        position: 'absolute',
        left: `${outerPosition()?.x ?? 0}px`,
        top: `${outerPosition()?.y ?? 0}px`,
        opacity: 0.8,
        'pointer-events': 'all',
        'z-index': Consts.zIndex.canvasOverlay,
        visibility: outerPosition() !== undefined && selectionState() !== 'idle' ? 'visible' : 'collapse',
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
            deletePixelInSelection();
          }}
          title='delete.'
        />
      </Show>
    </>
  );
};
