import createRAF, { targetFPS } from '@solid-primitives/raf';
import { makeTimer } from '@solid-primitives/timer';
import { Component, createSignal, onCleanup, onMount } from 'solid-js';
import Icon from '~/components/common/Icon';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { BoundBox } from '~/controllers/selection/SelectionMask';
import { cancelSelection, deletePixelInSelection } from '~/controllers/selection/SelectionOperator';
import { interactStore } from '~/stores/EditorStores';
import { vars } from '~/styles/global.css';
import { flexRow } from '~/styles/snippets.css';
import { eventBus, Events } from '~/utils/EventBus';

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
  const [outlineBoundBox, setOutlineBoundBox] = createSignal<BoundBox | undefined>();
  const [fps, setFps] = createSignal(60);
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
    }, fps)
  );

  const onSelectionChangedHandler = (e: Events['selection:changed']) => {
    setSelectionChanged(true);
    setCommitted(e.commit);
  };
  const onSelectionMovedHandler = (e: Events['selection:moved']) => {
    setSelectionChanged(true);
    setCommitted(true);
  };

  onMount(() => {
    startRenderLoop();
    eventBus.on('selection:changed', onSelectionChangedHandler);
    eventBus.on('selection:moved', onSelectionMovedHandler);
    setSelectionChanged(true);
  });
  onCleanup(() => {
    eventBus.off('selection:changed', onSelectionChangedHandler);
    eventBus.off('selection:moved', onSelectionMovedHandler);
    disposeInterval();
    stopRenderLoop();
  });

  const offsetX = () => interactStore.offsetOrigin.x + interactStore.offset.x;
  const offsetY = () => interactStore.offsetOrigin.y + interactStore.offset.y;
  const selectionMenuX = () => offsetX() + (outlineBoundBox()?.left! + selectionManager.getMoveOffset().x) * interactStore.zoom;
  const selectionMenuY = () => offsetY() + (outlineBoundBox()?.bottom! + selectionManager.getMoveOffset().y + 1) * interactStore.zoom;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${selectionMenuX()}px`,
        top: `${selectionMenuY()}px`,
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
        <div
          style={{
            margin: '6px',
            'pointer-events': 'all',
            cursor: 'pointer',
          }}
          onClick={() => {
            cancelSelection();
          }}
        >
          <Icon src='/icons/misc/clear.png' color={vars.color.onBackground} base={16} scale={1} />
        </div>
        <div
          style={{
            margin: '6px',
            'pointer-events': 'all',
            cursor: 'pointer',
          }}
        >
          <Icon src='/icons/misc/duplicate.png' color={vars.color.onBackground} base={16} scale={1} />
        </div>
        <div
          style={{
            margin: '6px',
            'pointer-events': 'all',
            cursor: 'pointer',
          }}
          onClick={(e) => {
            deletePixelInSelection();
          }}
        >
          <Icon src='/icons/misc/garbage.png' color={vars.color.onBackground} base={16} scale={1} />
        </div>
      </div>
    </div>
  );
};

export default SelectionMenu;
