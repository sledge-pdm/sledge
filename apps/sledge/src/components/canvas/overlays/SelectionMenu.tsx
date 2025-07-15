import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { makeTimer } from '@solid-primitives/timer';
import { Component, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { getRelativeCanvasAreaPosition } from '~/controllers/canvas/CanvasPositionCalculator';
import { selectionManager, SelectionState } from '~/controllers/selection/SelectionManager';
import { BoundBox } from '~/controllers/selection/SelectionMask';
import { cancelMove, cancelSelection, commitMove, deletePixelInSelection } from '~/controllers/selection/SelectionOperator';
import { globalConfig } from '~/stores/GlobalStores';
import { eventBus, Events } from '~/utils/EventBus';

interface ItemProps {
  src: string;
  onClick?: () => void;
}

const Item: Component<ItemProps> = (props) => {
  return (
    <div
      style={{
        margin: '6px',
        'pointer-events': 'all',
        cursor: 'pointer',
      }}
      onClick={props.onClick}
    >
      <Icon src={props.src} color={vars.color.onBackground} base={16} scale={1} />
    </div>
  );
};

const SelectionMenu: Component<{}> = (props) => {
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
          if (box) setOutlineBoundBox(box);
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

  const selectionMenuPos = () =>
    getRelativeCanvasAreaPosition({
      x: outlineBoundBox()?.left! + selectionManager.getMoveOffset().x,
      y: outlineBoundBox()?.bottom! + selectionManager.getMoveOffset().y + 1,
    });

  return (
    <div
      style={{
        position: 'absolute',
        left: `${selectionMenuPos().x}px`,
        top: `${selectionMenuPos().y}px`,
        visibility: committed() && outlineBoundBox() ? 'visible' : 'collapse',
        'image-rendering': 'auto',
        'pointer-events': 'all',
        'transform-origin': '0 0',
        'z-index': 500,
      }}
    >
      <div
        class={flexRow}
        style={{
          'margin-top': '8px',
          'background-color': vars.color.surface,
          border: `1px solid ${vars.color.onBackground}`,
          'pointer-events': 'all',
        }}
      >
        <Show when={selectionState() === 'move'}>
          <Item
            src='/icons/misc/check.png'
            onClick={() => {
              commitMove();
            }}
          />
          <Item
            src='/icons/misc/clear.png'
            onClick={() => {
              cancelMove();
            }}
          />
        </Show>
        <Show when={selectionState() === 'selected'}>
          <Item
            src='/icons/misc/clear.png'
            onClick={() => {
              cancelSelection();
            }}
          />
          {/* <Item src='/icons/misc/duplicate.png' onClick={() => {}} /> */}
          <Item
            src='/icons/misc/garbage.png'
            onClick={() => {
              deletePixelInSelection();
            }}
          />
        </Show>
      </div>
    </div>
  );
};

export default SelectionMenu;
