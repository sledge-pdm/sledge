import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { color } from '@sledge/theme';
import { Icon, MenuListOption, showContextMenu } from '@sledge/ui';
import { Component, createEffect, createMemo, onMount } from 'solid-js';
import { FrameHandles, FrameRect, OnCanvasFrameInteract } from '~/components/canvas/overlays/OnCanvasFrameInteract';
import { hideEntry, ImagePoolEntry, removeEntry, selectEntry, showEntry, transferToCurrentLayer, updateEntryPartial } from '~/features/image_pool';
import { useWebpBlobUrl } from '~/features/image_pool/useWebpBlobUrl';
import { interactStore } from '~/stores/EditorStores';
import { imagePoolStore } from '~/stores/ProjectStores';
import { ContextMenuItems } from '~/utils/ContextMenuItems';

const imageRoot = css`
  position: absolute;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  pointer-events: none;
  touch-action: none;
  z-index: var(--zindex-image-pool-image);
  transform-origin: 0 0;
  box-sizing: border-box;
`;

const imageContainer = css`
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  pointer-events: none;
  touch-action: none;
  z-index: var(--zindex-image-pool-image);
  image-rendering: pixelated;
  overflow: hidden;
  transform-origin: center center;
`;

const overlay = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;
const svgRoot = css`
  position: absolute;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
`;

const Image: Component<{ entry: ImagePoolEntry; index: number }> = ({ entry, index }) => {
  let containerRef: HTMLDivElement;
  let svgRef: SVGSVGElement;
  let entryInteract: OnCanvasFrameInteract | undefined;

  const imageSrc = useWebpBlobUrl(entry.webpBuffer);

  const viewWidth = createMemo(() => entry.base.width * entry.transform.scaleX);
  const viewHeight = createMemo(() => entry.base.height * entry.transform.scaleY);

  onMount(() => {
    // initial transform-related styling hints
    containerRef.style.willChange = 'transform';
    containerRef.style.backfaceVisibility = 'hidden';

    entryInteract = new OnCanvasFrameInteract(
      svgRef,
      () => {
        return {
          x: entry.transform.x,
          y: entry.transform.y,
          width: viewWidth(),
          height: viewHeight(),
          rotation: entry.transform.rotation,
        };
      },
      (r: FrameRect) => {
        // resize entry based on change
        const newScaleX = r.width / entry.base.width;
        const newScaleY = r.height / entry.base.height;
        const newTransform = {
          ...r,
          scaleX: newScaleX,
          scaleY: newScaleY,
        };
        updateEntryPartial(entry.id, {
          transform: newTransform,
        });
      },
      (startRect, endRect, e) => {
        // handle commit, but currently entryprop diffs are removed so just update transform in onChange().
      },
      {
        keepAspect: 'shift',
        snapToPixel: false,
      }
    );
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

  createEffect(() => {
    const preserveAspectRatio = imagePoolStore.preserveAspectRatio;
    entryInteract?.setOptions({ keepAspect: preserveAspectRatio ? 'always' : 'shift' });
  });

  return (
    <div
      class={imageRoot}
      id={entry.id}
      ref={(el) => (containerRef = el)}
      style={{
        display: entry.visible || imagePoolStore.selectedEntryId === entry.id ? 'flex' : 'none',
        width: `${viewWidth()}px`,
        height: `${viewHeight()}px`,
        transform: `translate(${entry.transform.x}px, ${entry.transform.y}px)`,
        cursor: imagePoolStore.selectedEntryId === entry.id ? 'all-scroll' : undefined,
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
        let label = entry.descriptionName ?? '[ unknown ]';
        if (!entry.visible) label += ' (hidden)';
        showContextMenu(
          [
            { type: 'label', label },
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
        class={imageContainer}
        style={{
          transform: `rotate(${entry.transform.rotation}deg)`,
        }}
      >
        <img
          src={imageSrc()}
          width={entry.base.width}
          height={entry.base.height}
          class={overlay}
          style={{
            'image-rendering': 'pixelated',
            opacity: entry.visible ? 1 : imagePoolStore.selectedEntryId === entry.id ? 0.5 : 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            'transform-origin': '0 0',
            scale: 1 / interactStore.zoom,
            opacity: imagePoolStore.selectedEntryId === entry.id ? 0.5 : 0.25,
          }}
        >
          <Icon src={'/icons/actions/image.png'} base={8} scale={2} color={'#808080'} />
        </div>
      </div>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        ref={(el) => (svgRef = el)}
        class={svgRoot}
        style={{
          'z-index': 'var(--zindex-image-pool-control)',
          'transform-origin': '50% 50%',
          transform: `rotate(${entry.transform.rotation}deg)`,
        }}
      >
        {/* 内部ドラッグ用の透明サーフェス */}
        <rect class={clsx('drag-surface', overlay)} fill={'transparent'} pointer-events={'all'} style={{ cursor: 'move' }} />
        {/* border rect */}
        <rect
          class={clsx('border-rect', overlay)}
          fill='none'
          stroke-opacity={imagePoolStore.selectedEntryId === entry.id ? 1 : 0.15}
          stroke={color.selectionBorder}
          stroke-width={1 / interactStore.zoom}
          vector-effect={'non-scaling-stroke'}
          pointer-events={'none'}
        />

        <FrameHandles
          edge
          corner
          rotate
          size={8 / interactStore.zoom}
          visible={imagePoolStore.selectedEntryId === entry.id}
          elementProps={{
            stroke: 'black',
            fill: 'white',
            'stroke-width': `${1 / interactStore.zoom}px`,
          }}
        />
      </svg>
    </div>
  );
};

export default Image;
