import { css } from '@acab/ecsstatic';
import { MenuListOption, showContextMenu } from '@sledge/ui';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Component, onMount } from 'solid-js';
import ImageEntryInteract from '~/components/canvas/overlays/image_pool/ImageEntryInteract';
import { hideEntry, ImagePoolEntry, removeEntry, selectEntry, showEntry, transferToCurrentLayer } from '~/features/image_pool';
import { interactStore } from '~/stores/EditorStores';
import { imagePoolStore } from '~/stores/ProjectStores';
import { ContextMenuItems } from '~/utils/ContextMenuItems';
import { pathToFileLocation } from '~/utils/FileUtils';

const imageElement = css`
  margin: 0;
  padding: 0;
  pointer-events: none;
  touch-action: none;
  z-index: var(--zindex-image-pool-image);
  image-rendering: pixelated;
`;

const Image: Component<{ entry: ImagePoolEntry; index: number }> = ({ entry, index }) => {
  let containerRef: HTMLDivElement;
  let svgRef: SVGSVGElement;
  let entryInteract: ImageEntryInteract | undefined;

  onMount(() => {
    // initial transform-related styling hints
    containerRef.style.willChange = 'transform';
    containerRef.style.backfaceVisibility = 'hidden';

    entryInteract = new ImageEntryInteract(svgRef, entry.id);
    entryInteract.setInteractListeners();

    const canvasArea = document.getElementById('canvas-area');

    const handleImageSelection = (e: MouseEvent) => {
      if (!canvasArea?.contains(e.target as HTMLElement)) return;
      if (containerRef && !containerRef.contains(e.target as HTMLElement)) {
        if (imagePoolStore.selectedEntryId === entry.id) {
          selectEntry(undefined);
        }
      } else {
        selectEntry(entry.id);
      }
    };
    document.addEventListener('click', handleImageSelection);
    () => {
      document.removeEventListener('click', handleImageSelection);
      entryInteract?.removeInteractListeners();
    };
  });

  const Handle: Component<{ x: string; y: string; 'data-pos': string; size?: number }> = (handleProps) => {
    // オーバーレイはスケールしないので、ズームのみ相殺
    const size = () => (handleProps.size ?? 8) / interactStore.zoom;
    return (
      <rect
        x={handleProps.x}
        y={handleProps.y}
        class={'resize-handle'}
        data-pos={handleProps['data-pos']}
        width={size()}
        height={size()}
        stroke='black'
        fill='white'
        stroke-width={1 / interactStore.zoom}
        vector-effect={'non-scaling-stroke'}
        pointer-events='all'
        style={{
          cursor: `${handleProps['data-pos']}-resize`,
          transform: `translate(-${size() / 2}px, -${size() / 2}px)`,
          position: 'absolute',
          visibility: imagePoolStore.selectedEntryId === entry.id ? 'visible' : 'collapse',
        }}
      />
    );
  };

  // const selected = createMemo<boolean>(() => imagePoolStore.selectedEntryId === entry.id);

  return (
    <div
      class={'image_root'}
      id={entry.id}
      ref={(el) => (containerRef = el)}
      style={{
        display: entry.visible || imagePoolStore.selectedEntryId === entry.id ? 'flex' : 'none',
        position: 'absolute',
        'pointer-events': 'all',
        'box-sizing': 'border-box',
        'transform-origin': '0 0',
        transform: `translate(${entry.transform.x}px, ${entry.transform.y}px)`,
        margin: 0,
        padding: 0,
        cursor: imagePoolStore.selectedEntryId === entry.id ? 'all-scroll' : undefined,
        'z-index': 'var(--zindex-image-pool-image)',
      }}
      tabIndex={index}
      onClick={(e) => {
        e.currentTarget.focus();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        selectEntry(entry.id);
        const showHideItem: MenuListOption = entry.visible
          ? {
              ...ContextMenuItems.BaseImageHide,
              onSelect: () => {
                hideEntry(entry.id);
                selectEntry(undefined);
              },
            }
          : {
              ...ContextMenuItems.BaseImageShow,
              onSelect: () => {
                showEntry(entry.id);
                selectEntry(entry.id);
              },
            };
        showContextMenu(
          `${pathToFileLocation(entry.imagePath)?.name}${entry.visible ? '' : ' (hidden)'}`,
          [
            showHideItem,
            {
              ...ContextMenuItems.BaseTransfer,
              onSelect: () => transferToCurrentLayer(entry.id, false),
            },
            {
              ...ContextMenuItems.BaseTransferRemove,
              onSelect: () => transferToCurrentLayer(entry.id, true),
            },
            {
              ...ContextMenuItems.BaseRemove,
              label: 'Remove from pool',
              onSelect: () => removeEntry(entry.id),
            },
          ],
          e
        );
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          margin: 0,
          padding: 0,
          'transform-origin': '0 0',
          transform: `scale(${entry.transform.scaleX}, ${entry.transform.scaleY})`,
        }}
      >
        <img
          src={convertFileSrc(entry.imagePath)}
          class={imageElement}
          width={entry.base.width}
          height={entry.base.height}
          style={{
            width: `${entry.base.width}px`,
            height: `${entry.base.height}px`,
            opacity: entry.visible ? 1 : imagePoolStore.selectedEntryId === entry.id ? 0.5 : 0,
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
          'z-index': 'var(--zindex-image-pool-control)',
          width: `${entry.base.width * entry.transform.scaleX}px`,
          height: `${entry.base.height * entry.transform.scaleY}px`,
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
            visibility: imagePoolStore.selectedEntryId === entry.id ? 'visible' : 'collapse',
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
