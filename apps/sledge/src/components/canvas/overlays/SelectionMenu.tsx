import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { makeTimer } from '@solid-primitives/timer';
import { Component, createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { getRelativeCanvasAreaPosition } from '~/controllers/canvas/CanvasPositionCalculator';
import { selectionManager, SelectionState } from '~/controllers/selection/SelectionManager';
import { BoundBox } from '~/controllers/selection/SelectionMask';
import { cancelMove, cancelSelection, commitMove } from '~/controllers/selection/SelectionOperator';
import { globalConfig } from '~/stores/GlobalStores';
import { eventBus, Events } from '~/utils/EventBus';

import { Vec2 } from '@sledge/core';
import { interactStore } from '~/stores/EditorStores';
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
      <p>{props.label}</p>
    </div>
  );
};

const Divider: Component = () => {
  return <div class={styles.divider} />;
};

const SelectionMenu: Component<{}> = (props) => {
  let menuRef: HTMLDivElement;
  let containerRef: HTMLDivElement;
  const borderDash = 6;
  const [borderOffset, setBorderOffset] = createSignal<number>(0);
  const disposeInterval = makeTimer(
    () => {
      setBorderOffset((borderOffset() + 1) % (borderDash * 2));
    },
    100,
    setInterval
  );

  const [selectionChanged, setSelectionChanged] = createSignal<boolean>(false);
  const [committed, setCommitted] = createSignal<boolean>(true);
  const [selectionState, setSelectionState] = createSignal<SelectionState>(selectionManager.getState());
  const [outlineBoundBox, setOutlineBoundBox] = createSignal<BoundBox | undefined>();
  const [isRunning, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS((timeStamp) => {
      if (!selectionManager.isSelected) {
        setOutlineBoundBox(undefined);
      } else {
        if (selectionChanged()) {
          const box = selectionManager.getSelectionMask().getBoundBox();
          setOutlineBoundBox(box);
        }
      }
      setSelectionChanged(false);
    }, Number(globalConfig.performance.targetFPS))
  );

  const onSelectionChangedHandler = (e: Events['selection:areaChanged']) => {
    setSelectionChanged(true);
    setCommitted(e.commit);
  };
  const onSelectionMovedHandler = (e: Events['selection:moved']) => {
    setSelectionChanged(true);
    setCommitted(true);
  };
  const onStateChangedHandler = (e: Events['selection:stateChanged']) => {
    setSelectionState(e.newState);
  };

  onMount(() => {
    startRenderLoop();
    eventBus.on('selection:areaChanged', onSelectionChangedHandler);
    eventBus.on('selection:moved', onSelectionMovedHandler);
    eventBus.on('selection:stateChanged', onStateChangedHandler);
  });
  onCleanup(() => {
    eventBus.off('selection:areaChanged', onSelectionChangedHandler);
    eventBus.off('selection:moved', onSelectionMovedHandler);
    eventBus.off('selection:stateChanged', onStateChangedHandler);
    disposeInterval();
    stopRenderLoop();
  });

  const selectionMenuPos = createMemo<Vec2>((prev) => {
    const boundBox = outlineBoundBox();
    if (!boundBox || !menuRef) return prev ?? { x: 0, y: 0 };

    const menuRect = menuRef.getBoundingClientRect();
    const menuWidth = menuRect.width;
    const menuHeight = menuRect.height;

    // 基本位置：選択範囲の右下
    let basePos = getRelativeCanvasAreaPosition({
      x: boundBox.right + selectionManager.getMoveOffset().x + 1 - menuWidth / interactStore.zoom,
      y: boundBox.bottom + selectionManager.getMoveOffset().y + 1,
    });

    const canvasArea = document.getElementById('zoompan-wrapper') as HTMLElement;
    if (canvasArea) {
      const canvasRect = canvasArea.getBoundingClientRect();
      const canvasRight = canvasRect.width;
      const canvasBottom = canvasRect.height;

      const originalBasePos = { ...basePos };

      // 画面外に出る場合は画面内に収める
      basePos.x = Math.min(Math.max(0, basePos.x), canvasRight - menuWidth);
      basePos.y = Math.min(Math.max(0, basePos.y), canvasBottom - menuHeight);

      // 画面外に出た場合
      if (basePos.x !== originalBasePos.x || basePos.y !== originalBasePos.y) {
        containerRef.style.margin = '8px';
        containerRef.style.opacity = '0.85';
      } else {
        containerRef.style.margin = '8px 0 0 0';
        containerRef.style.opacity = '1';
      }
    }

    return basePos;
  });

  return (
    <div
      ref={(ref) => (menuRef = ref)}
      style={{
        position: 'absolute',
        left: `${selectionMenuPos().x}px`,
        top: `${selectionMenuPos().y}px`,
        visibility: committed() && outlineBoundBox() ? 'visible' : 'collapse',
        'image-rendering': 'auto',
        'pointer-events': 'all',
        'z-index': 500,
      }}
    >
      <div ref={(ref) => (containerRef = ref)} class={styles.container}>
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
          {/* <Divider />
          <Item
            src='/icons/tool_bar/tool/move_area.png'
            onClick={() => {
              cancelSelection();
            }}
          />
          <Divider />
          <Item
            src='/icons/tool_bar/tool/move.png'
            onClick={() => {
              cancelSelection();
            }}
          /> */}
        </Show>
      </div>
    </div>
  );
};

export default SelectionMenu;
