import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component, createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { selectionManager, SelectionState } from '~/controllers/selection/SelectionManager';
import { cancelMove, cancelSelection, commitMove, deletePixelInSelection } from '~/controllers/selection/SelectionOperator';
import { eventBus, Events } from '~/utils/EventBus';

import { Vec2 } from '@sledge/core';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import * as styles from '~/styles/components/canvas/overlays/selection_menu.css';

interface ItemProps {
  src: string;
  label?: string;
  onClick?: () => void;
}

const Item: Component<ItemProps> = (props) => {
  return (
    <div class={styles.item} onClick={props.onClick}>
      <Icon src={props.src} color={vars.color.onBackground} base={10} scale={1} />
      <Show when={props.label}>
        <p>{props.label}</p>
      </Show>
    </div>
  );
};

const Divider: Component = () => {
  return <div class={styles.divider} />;
};

const [selectionState, setSelectionState] = createSignal<SelectionState>(selectionManager.getState());

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

  const handleAreaChanged = (e: Events['selection:areaChanged']) => setUpdatePosition(true);
  const handleMoved = (e: Events['selection:moved']) => setUpdatePosition(true);
  const handleStateChanged = (e: Events['selection:stateChanged']) => {
    setSelectionState(e.newState);
    setUpdatePosition(true);
  };

  onMount(() => {
    startRenderLoop();
    eventBus.on('selection:areaChanged', handleAreaChanged);
    eventBus.on('selection:moved', handleMoved);
    eventBus.on('selection:stateChanged', handleStateChanged);
  });
  onCleanup(() => {
    stopRenderLoop();
    eventBus.off('selection:areaChanged', handleAreaChanged);
    eventBus.off('selection:moved', handleMoved);
    eventBus.off('selection:stateChanged', handleStateChanged);
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

    // 基本位置：選択範囲の右下
    let basePos = {
      x: outlineBound.right + selectionManager.getMoveOffset().x + 1,
      y: outlineBound.bottom + selectionManager.getMoveOffset().y + 1,
    };

    setSelectionMenuPos(basePos);

    const canvasArea = document.getElementById('zoompan-wrapper') as HTMLElement;
    if (canvasArea) {
      const canvasRect = canvasArea.getBoundingClientRect();

      const originalContainerPos: Vec2 = { x: containerRect.x, y: containerRect.y };
      const newContainerPos: Vec2 = { x: containerRect.x, y: containerRect.y };
      const outerMargin = 8;
      // check if the menu is out of the canvas area
      if (originalContainerPos.x < canvasRect.x + outerMargin) {
        newContainerPos.x = canvasRect.x + outerMargin;
      }
      if (originalContainerPos.y < canvasRect.y + outerMargin) {
        newContainerPos.y = canvasRect.y + outerMargin;
      }
      if (canvasRect.right - outerMargin < containerRect.right) {
        newContainerPos.x = canvasRect.right - containerRect.width - outerMargin;
      }
      if (canvasRect.bottom - outerMargin < containerRect.bottom) {
        newContainerPos.y = canvasRect.bottom - containerRect.height - outerMargin;
      }

      // 画面外に出た場合
      if (newContainerPos.x !== originalContainerPos.x || newContainerPos.y !== originalContainerPos.y) {
        setOuterPosition({ x: newContainerPos.x - canvasRect.x, y: newContainerPos.y - canvasRect.y });
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
        visibility: outerPosition() === undefined ? 'visible' : 'collapse',
        'pointer-events': 'all',
        'z-index': 500,
        'transform-origin': '0 0',
        transform: `scale(${1 / interactStore.zoom})`,
      }}
    >
      <div
        ref={(ref) => (containerRef = ref)}
        class={styles.container}
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
        'z-index': 1000,
        visibility: outerPosition() ? 'visible' : 'collapse',
      }}
    >
      <div class={styles.container}>{MenuContent()}</div>
    </div>
  );
};

const MenuContent = () => {
  return (
    <>
      <Show when={selectionState() === 'move_layer' || selectionState() === 'move_selection'}>
        <Item
          src='/icons/selection/commit_10.png'
          onClick={() => {
            commitMove();
          }}
          label='commit.'
        />
        <Divider />
        <Item
          src='/icons/selection/cancel_10.png'
          onClick={() => {
            cancelMove();
          }}
          label='cancel.'
        />
      </Show>
      <Show when={selectionState() === 'selected'}>
        <Item
          src='/icons/selection/cancel_10.png'
          onClick={() => {
            cancelSelection();
          }}
          label='cancel.'
        />
        <Divider />
        <Item
          src='/icons/selection/delete_10.png'
          onClick={() => {
            deletePixelInSelection();
          }}
        />
      </Show>
    </>
  );
};
