import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { makeTimer } from '@solid-primitives/timer';
import { Component, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { getRelativeCanvasAreaPosition } from '~/controllers/canvas/CanvasPositionCalculator';
import { selectionManager, SelectionState } from '~/controllers/selection/SelectionManager';
import { BoundBox } from '~/controllers/selection/SelectionMask';
import { cancelMove, cancelSelection, commitMove } from '~/controllers/selection/SelectionOperator';
import { globalConfig } from '~/stores/GlobalStores';
import { eventBus, Events } from '~/utils/EventBus';

import { Vec2 } from '@sledge/core';
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

  const selectionMenuPos = (): Vec2 => {
    const boundBox = outlineBoundBox();
    if (!boundBox) return { x: 0, y: 0 };
    const pos = getRelativeCanvasAreaPosition({
      x: boundBox.right + selectionManager.getMoveOffset().x,
      y: boundBox.bottom + selectionManager.getMoveOffset().y + 1,
    });
    return pos;
  };

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
        'transform-origin': '0 0',
        transform: "translateX(-100%)",
        'z-index': 500,
      }}
    >
      <div class={styles.container}>
        <Show when={selectionState() === 'move'}>
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
          {/* <Item src='/icons/misc/duplicate.png' onClick={() => {}} /> */}
          {/* <Item
            src='/icons/selection/delete_10.png'
            onClick={() => {
              deletePixelInSelection();
            }}
            label='delete.'
          />
          <Divider /> */}
          <Item
            src='/icons/selection/cancel_10.png'
            onClick={() => {
              cancelSelection();
            }}
            label='cancel.'
          />
        </Show>
      </div>
    </div>
  );
};

export default SelectionMenu;
