import { MenuListOption, showContextMenu } from '@sledge/ui';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Component, createMemo, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import ImageEntryInteract from '~/components/canvas/overlays/image_pool/ImageEntryInteract';
import { ContextMenuItems } from '~/components/menu/ContextMenuItems';
import { Consts } from '~/Consts';
import { getEntry, hideEntry, ImagePoolEntry, removeEntry, selectEntry, showEntry, transferToCurrentLayer } from '~/features/image_pool';
import { interactStore } from '~/stores/EditorStores';
import { imagePoolStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';

const Image: Component<{ entry: ImagePoolEntry; index: number }> = (props) => {
  const [stateStore, setStateStore] = createStore({
    visible: props.entry.visible,
    // transform-based drawing state
    tx: props.entry.transform.x,
    ty: props.entry.transform.y,
    sx: props.entry.transform.scaleX,
    sy: props.entry.transform.scaleY,
    baseW: props.entry.base.width,
    baseH: props.entry.base.height,
  });

  let containerRef: HTMLDivElement;
  let imageRef: HTMLImageElement;
  let svgRef: SVGSVGElement;
  let onEntryChangedHandler: ((e: { id: string }) => void) | undefined;
  let entryInteract: ImageEntryInteract | undefined;

  onMount(() => {
    const onEntryChanged = (e: { id: string }) => {
      if (e.id !== props.entry.id) return;
      const latest = getEntry(props.entry.id);
      if (!latest) return;
      // update reactive state only; styles bind to these
      setStateStore({
        visible: latest.visible,
        tx: latest.transform.x,
        ty: latest.transform.y,
        sx: latest.transform.scaleX,
        sy: latest.transform.scaleY,
        baseW: latest.base.width,
        baseH: latest.base.height,
      });
    };
    onEntryChangedHandler = onEntryChanged;
    eventBus.on('imagePool:entryPropChanged', onEntryChanged);

    // initial transform-related styling hints
    containerRef.style.willChange = 'transform';
    containerRef.style.backfaceVisibility = 'hidden';

    // attach entry-level pointer interactions (logging only for now)
    entryInteract = new ImageEntryInteract(svgRef, () => getEntry(props.entry.id) ?? props.entry);
    entryInteract.setInteractListeners();

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef && !containerRef.contains(e.target as Node)) {
        if (selected()) {
          selectEntry(undefined);
        }
      } else {
        selectEntry(props.entry.id);
      }
    };

    const canvasArea = document.getElementById('canvas-area');
    if (canvasArea) canvasArea.addEventListener('click', handleClickOutside);

    () => {
      const canvasArea = document.getElementById('canvas-area');
      if (canvasArea) canvasArea.removeEventListener('click', handleClickOutside);
      if (onEntryChangedHandler) eventBus.off('imagePool:entryPropChanged', onEntryChangedHandler);
      entryInteract?.removeInteractListeners();
    };
  });

  const Handle: Component<{ x: string; y: string; 'data-pos': string; size?: number }> = (props) => {
    // オーバーレイはスケールしないので、ズームのみ相殺
    const size = () => (props.size ?? 8) / interactStore.zoom;
    return (
      <rect
        x={props.x}
        y={props.y}
        class={'resize-handle'}
        data-pos={props['data-pos']}
        width={size()}
        height={size()}
        stroke='black'
        fill='white'
        stroke-width={1 / interactStore.zoom}
        vector-effect={'non-scaling-stroke'}
        pointer-events='all'
        style={{
          cursor: `${props['data-pos']}-resize`,
          transform: `translate(-${size() / 2}px, -${size() / 2}px)`,
          position: 'absolute',
          visibility: selected() ? 'visible' : 'collapse',
        }}
      />
    );
  };

  const selected = createMemo<boolean>(() => imagePoolStore.selectedEntryId === props.entry.id);

  return (
    <div
      class={'image_root'}
      id={props.entry.id}
      ref={(el) => (containerRef = el)}
      style={{
        display: stateStore.visible || selected() ? 'flex' : 'none',
        position: 'absolute',
        'pointer-events': 'all',
        'box-sizing': 'border-box',
        'transform-origin': '0 0',
        // ルートは移動のみ（スケールは内側に適用）
        transform: `translate3d(${stateStore.tx}px, ${stateStore.ty}px, 0)`,
        margin: 0,
        padding: 0,
        cursor: selected() ? 'all-scroll' : undefined,
        'z-index': Consts.zIndex.imagePoolImage,
      }}
      tabIndex={props.index}
      onClick={(e) => {
        e.currentTarget.focus();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const showHideItem: MenuListOption = stateStore.visible
          ? {
              ...ContextMenuItems.BaseImageHide,
              onSelect: () => {
                hideEntry(props.entry.id);
                selectEntry(undefined);
              },
            }
          : {
              ...ContextMenuItems.BaseImageShow,
              onSelect: () => {
                showEntry(props.entry.id);
                selectEntry(props.entry.id);
              },
            };
        showContextMenu(
          `${props.entry.fileName}${stateStore.visible ? '' : ' (hidden)'}`,
          [
            showHideItem,
            {
              ...ContextMenuItems.BaseTransfer,
              onSelect: () => transferToCurrentLayer(props.entry.id, false),
            },
            {
              ...ContextMenuItems.BaseTransferRemove,
              onSelect: () => transferToCurrentLayer(props.entry.id, true),
            },
            {
              ...ContextMenuItems.BaseRemove,
              label: 'Remove from pool',
              onSelect: () => removeEntry(props.entry.id),
            },
          ],
          e
        );
      }}
    >
      {/* スケールは画像側のラッパーに適用 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          margin: 0,
          padding: 0,
          'transform-origin': '0 0',
          transform: `scale(${stateStore.sx}, ${stateStore.sy})`,
        }}
      >
        <img
          ref={(el) => (imageRef = el)}
          src={convertFileSrc(props.entry.originalPath)}
          width={stateStore.baseW}
          height={stateStore.baseH}
          style={{
            margin: 0,
            padding: 0,
            width: `${stateStore.baseW}px`,
            height: `${stateStore.baseH}px`,
            'z-index': Consts.zIndex.imagePoolImage,
            opacity: stateStore.visible ? 1 : selected() ? 0.5 : 0,
            'pointer-events': 'none',
            'touch-action': 'none',
          }}
        />
      </div>

      <svg
        xmlns='http://www.w3.org/2000/svg'
        ref={(el) => (svgRef = el)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          margin: 0,
          padding: 0,
          'image-rendering': 'pixelated',
          'shape-rendering': 'geometricPrecision',
          overflow: 'visible',
          'z-index': Consts.zIndex.imagePoolControl,
          width: `${stateStore.baseW * stateStore.sx}px`,
          height: `${stateStore.baseH * stateStore.sy}px`,
        }}
      >
        {/* 内部ドラッグ用の透明サーフェス */}
        <rect
          class={'drag-surface'}
          x={'0'}
          y={'0'}
          width={'100%'}
          height={'100%'}
          fill={'transparent'}
          pointer-events={'all'}
          style={{ cursor: 'move' }}
        />
        {/* border rect */}
        <rect
          class={'border-rect'}
          width={'100%'}
          height={'100%'}
          fill='none'
          stroke='black'
          stroke-width={1 / interactStore.zoom}
          vector-effect={'non-scaling-stroke'}
          style={{
            visibility: selected() ? 'visible' : 'collapse',
            'pointer-events': 'none',
          }}
        />
        {/* 四隅 */}
        <Handle x={'0'} y={'0'} data-pos='nw' />
        <Handle x={'100%'} y={'0'} data-pos='ne' />
        <Handle x={'100%'} y={'100%'} data-pos='se' />
        <Handle x={'0'} y={'100%'} data-pos='sw' />
        {/* 四辺 */}
        <Handle x={'50%'} y={'0'} data-pos='n' />
        <Handle x={'100%'} y={'50%'} data-pos='e' />
        <Handle x={'50%'} y={'100%'} data-pos='s' />
        <Handle x={'0'} y={'50%'} data-pos='w' />
      </svg>
    </div>
  );
};

export default Image;
