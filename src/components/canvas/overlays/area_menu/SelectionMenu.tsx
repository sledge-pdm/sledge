import { Icon } from '@sledge-pdm/ui';
import { Component, createEffect, createMemo, createSignal, onMount, Show } from 'solid-js';
import { selectionManager, SelectionUpdateType } from '~/features/selection/SelectionManager';
import { cancelSelection, convertSelectionToImage, deleteSelectedArea } from '~/features/selection/service';

import { css } from '@acab/ecsstatic';
import { Vec2 } from '@sledge-pdm/core';
import { color } from '@sledge-pdm/ui';
import { coordinateTransform } from '~/features/canvas/transform/UnifiedCoordinateTransform';
import { interactStore } from '~/stores/EditorStores';
import { CanvasPos } from '~/types/CoordinateTypes';

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
  z-index: var(--zindex-canvas-overlay);
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
    <div
      class={item}
      onClick={(e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        props.onClick?.();
      }}
      title={props.title}
    >
      <Icon src={props.src} color={color.onBackground} base={10} />
      <Show when={props.label}>
        <p>{props.label}</p>
      </Show>
    </div>
  );
};

const [outerPosition, setOuterPosition] = createSignal<Vec2 | undefined>(undefined);

export const OnCanvasSelectionMenu: Component = () => {
  let containerRef: HTMLDivElement;
  let sectionsBetweenAreaRef: HTMLElement | null = null;

  const [showMenu, setShowMenu] = createSignal<boolean>(false);

  const onSelectionUpdate = (e: { type: SelectionUpdateType }) => {
    setShowMenu(selectionManager.hasSelection() && !selectionManager.getFront());

    // Menu shouldn't updated for front (preview) updates
    if (e.type === 'front') return;
    updateMenuPos();
  };

  onMount(() => {
    const unsubscribe = selectionManager.subscribe(onSelectionUpdate);

    const observer = new ResizeObserver(() => {
      updateMenuPos();
    });
    sectionsBetweenAreaRef = document.getElementById('sections-between-area') as HTMLElement;
    if (sectionsBetweenAreaRef) {
      observer.observe(sectionsBetweenAreaRef);
    }

    return () => {
      unsubscribe();
      observer.disconnect();
    };
  });

  // Reposition only while a selection is active and transform changes
  createEffect(() => {
    interactStore.rotation;
    interactStore.horizontalFlipped;
    interactStore.verticalFlipped;
    interactStore.offset.x;
    interactStore.offset.y;
    updateMenuPos();
  });

  const [selectionMenuPos, setSelectionMenuPos] = createSignal<Vec2>({ x: 0, y: 0 });

  const updateMenuPos = () => {
    if (!selectionManager.hasSelection()) return;
    if (!containerRef) return;
    const boundbox = selectionManager.getBoundBox();
    if (!boundbox) return;
    const width = boundbox.right - boundbox.left + 1;
    const height = boundbox.bottom - boundbox.top + 1;
    const selectionOffset = selectionManager.getOffset();
    const offset = {
      x: boundbox.left + selectionOffset.x,
      y: boundbox.top + selectionOffset.y,
    };

    const left = offset.x;
    const top = offset.y;
    const right = left + width;
    const bottom = top + height;

    const rightBottomOnScreen = coordinateTransform.canvasToWindowForOverlay(
      CanvasPos.create(interactStore.horizontalFlipped ? left : right, interactStore.verticalFlipped ? top : bottom)
    );
    const containerWidth = containerRef.offsetWidth;
    const containerHeight = containerRef.offsetHeight;
    const anchor = { x: rightBottomOnScreen.x - containerWidth, y: rightBottomOnScreen.y };
    setSelectionMenuPos(anchor);

    // Outer 領域 (sections-between-area) へのクランプ
    if (!sectionsBetweenAreaRef) return;

    // 統合座標システムのキャッシュを活用してgetBoundingClientRect呼び出しを最適化
    const areaRect = coordinateTransform.getBoundingClientRect(sectionsBetweenAreaRef);
    const containerRect = coordinateTransform.getBoundingClientRect(containerRef);
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
    if (!showMenu()) return 'collapse';
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
        transform: `rotate(${interactStore.rotation}deg) translate3d(0px, 4px, 0px)`,
        'z-index': 'var(--zindex-canvas-overlay)',
        'will-change': 'transform',
      }}
    >
      <div ref={(ref) => (containerRef = ref)} class={container}>
        {MenuContent()}
      </div>
    </div>
  );
};

export const OuterSelectionMenu: Component = () => {
  const [showMenu, setShowMenu] = createSignal<boolean>(false);

  const handleUpdate = (e: { type: SelectionUpdateType; immediate?: boolean }) => {
    setShowMenu(selectionManager.hasSelection() && !selectionManager.getFront());
  };

  onMount(() => {
    const unsubscribe = selectionManager.subscribe(handleUpdate);
    return () => {
      unsubscribe();
    };
  });

  const visibility = createMemo(() => {
    if (!showMenu()) return 'collapse';
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
    >
      <div class={container}>{MenuContent()}</div>
    </div>
  );
};

const MenuContent = () => {
  return (
    <>
      <Item
        src='/assets/icons/selection/cancel_10.png'
        onClick={() => {
          cancelSelection();
        }}
        label='cancel.'
        title='cancel.'
      />
      <div class={divider} />
      <Item
        src='/assets/icons/selection/to_image_10.png'
        onClick={async () => {
          await convertSelectionToImage(true);
        }}
        title='copy to image.'
      />
      <div class={divider} />
      <Item
        src='/assets/icons/selection/delete_10.png'
        onClick={() => {
          deleteSelectedArea();
        }}
        title='delete.'
      />
    </>
  );
};
