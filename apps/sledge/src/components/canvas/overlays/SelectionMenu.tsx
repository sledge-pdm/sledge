import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component, createEffect, createSignal, onMount, Show } from 'solid-js';
import { selectionManager, SelectionState } from '~/controllers/selection/SelectionAreaManager';
import { cancelMove, cancelSelection, commitMove, deletePixelInSelection, getSelectionOffset, invertSelectionArea } from '~/controllers/selection/SelectionOperator';
import { eventBus, Events } from '~/utils/EventBus';

import { Vec2 } from '@sledge/core';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Consts } from '~/models/Consts';
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
  };
  const handleMoved = (e: Events['selection:offsetChanged']) => setUpdatePosition(true);
  const handleStateChanged = (e: Events['selection:stateChanged']) => {
    setSelectionState(e.newState);
    setUpdatePosition(true);
  };
  const handleMoveStateChanged = (e: Events['floatingMove:stateChanged']) => {
    setFloatingMoveState(e.moving);
  };
  onMount(() => {
    startRenderLoop();
    eventBus.on('selection:maskChanged', handleAreaChanged);
    eventBus.on('selection:offsetChanged', handleMoved);
    eventBus.on('selection:stateChanged', handleStateChanged);
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
      eventBus.off('floatingMove:stateChanged', handleMoveStateChanged);
      observer.disconnect();
    };
  });

  createEffect(() => {
    interactStore.zoom;
    interactStore.rotation;
    interactStore.offset.x;
    interactStore.offset.y;
    setUpdatePosition(true);
  });

  const [selectionMenuPos, setSelectionMenuPos] = createSignal<Vec2>({ x: 0, y: 0 });

  const updateMenuPos = () => {
    const outlineBound = selectionManager.getSelectionMask().getBoundBox();
    if (!outlineBound) return;

    const containerRect = containerRef.getBoundingClientRect();
    const selectionOffset = getSelectionOffset();
    // 基本位置：選択範囲の右下
    let basePos = {
      x: outlineBound.right + selectionOffset.x + 1,
      y: outlineBound.bottom + selectionOffset.y + 1,
    };

    setSelectionMenuPos(basePos);

    const sectionsBetweenArea = document.getElementById('sections-between-area') as HTMLElement;
    if (sectionsBetweenArea) {
      const areaRect = sectionsBetweenArea.getBoundingClientRect();

      const originalContainerPos: Vec2 = { x: containerRect.x, y: containerRect.y };
      const newContainerPos: Vec2 = { x: containerRect.x, y: containerRect.y };
      const outerMargin = 8;
      // check if the menu is out of the canvas area
      if (originalContainerPos.x < areaRect.x + outerMargin) {
        newContainerPos.x = areaRect.x + outerMargin;
      }
      if (originalContainerPos.y < areaRect.y + outerMargin) {
        newContainerPos.y = areaRect.y + outerMargin;
      }
      if (areaRect.right - outerMargin < containerRect.right) {
        newContainerPos.x = areaRect.right - containerRef.offsetWidth - outerMargin;
      }
      if (areaRect.bottom - outerMargin < containerRect.bottom) {
        newContainerPos.y = areaRect.bottom - containerRef.offsetHeight - outerMargin;
      }

      // 画面外に出た場合
      if (newContainerPos.x !== originalContainerPos.x || newContainerPos.y !== originalContainerPos.y) {
        setOuterPosition({ x: newContainerPos.x - areaRect.x, y: newContainerPos.y - areaRect.y });
      } else {
        containerRef.style.margin = `8px 0 0 0`;
        setOuterPosition(undefined);
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${selectionMenuPos().x}px`,
        top: `${selectionMenuPos().y}px`,
        visibility: outerPosition() === undefined && selectionState() !== 'idle' ? 'visible' : 'collapse',
        'pointer-events': 'all',
        'z-index': Consts.zIndex.canvasOverlay,
        'transform-origin': '0 0',
        transform: `scale(${1 / interactStore.zoom})`,
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
      <div
        ref={(ref) => (containerRef = ref)}
        class={container}
        style={{
          translate: '-100% 0',
        }}
      >
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
