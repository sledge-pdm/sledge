import { showContextMenu } from '@sledge/ui';
import { convertFileSrc } from '@tauri-apps/api/core';
import interact from 'interactjs';
import { Component, onCleanup, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { burndownToCurrentLayer, getEntry, removeEntry, updateEntryPartial } from '~/controllers/canvas/image_pool/ImagePoolController';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { Consts } from '~/models/Consts';
import { ContextMenuItems } from '~/models/menu/ContextMenuItems';
import { interactStore } from '~/stores/EditorStores';
import { eventBus } from '~/utils/EventBus';

const Image: Component<{ entry: ImagePoolEntry; index: number }> = (props) => {
  const [stateStore, setStateStore] = createStore({
    selected: false,
    visible: props.entry.visible,
  });

  let containerRef: HTMLDivElement;
  let imageRef: HTMLImageElement;
  let svgRef: SVGSVGElement;
  let onEntryChangedHandler: ((e: { id: string }) => void) | undefined;

  onMount(() => {
    const onEntryChanged = (e: { id: string }) => {
      if (e.id !== props.entry.id) return;
      const latest = getEntry(props.entry.id);
      if (!latest) return;
      // reflect current store state to DOM
      imageRef.style.width = latest.width * latest.scale + 'px';
      imageRef.style.height = latest.height * latest.scale + 'px';
      svgRef.style.width = latest.width * latest.scale + 'px';
      svgRef.style.height = latest.height * latest.scale + 'px';
      containerRef.style.transform = `translate(${latest.x}px, ${latest.y}px)`;
      setStateStore('visible', latest.visible);
    };
    onEntryChangedHandler = onEntryChanged;
    eventBus.on('imagePool:entryPropChanged', onEntryChanged);

    imageRef.onload = () => {
      interact(containerRef)
        .resizable({
          edges: { top: true, left: true, bottom: true, right: true },
          allowFrom: '.resize-handle',
          listeners: {
            move(event) {
              if (!stateStore.selected) return;
              const zoom = interactStore.zoom;
              const base = getEntry(props.entry.id) ?? props.entry;
              // use event.scale if provided by interactjs; fallback to ratio of current/previous width
              const currW = event.rect.width / zoom;
              const prevW = (event.rect.width - event.deltaRect.width) / zoom;
              const frameScale = typeof (event as any).scale === 'number' ? (event as any).scale : prevW > 0 ? currW / prevW : 1;
              const newScale = base.scale * frameScale;
              const newWidth = base.width * newScale;
              const newHeight = base.height * newScale;

              imageRef.style.width = newWidth + 'px';
              imageRef.style.height = newHeight + 'px';

              console.log(newWidth, newHeight);
              svgRef.style.width = newWidth + 'px';
              svgRef.style.height = newHeight + 'px';

              const nx = base.x + event.deltaRect.left / zoom;
              const ny = base.y + event.deltaRect.top / zoom;
              containerRef.style.transform = `translate(${nx}px, ${ny}px)`;
              // write-through to store so consumers (e.g., burndown) always see latest
              updateEntryPartial(props.entry.id, { x: nx, y: ny, scale: newScale });
            },
            end(event) {
              if (!stateStore.selected) return;
              // idempotent final commit
              const zoom = interactStore.zoom;
              const base = getEntry(props.entry.id) ?? props.entry;
              const currW = event.rect.width / zoom;
              const prevW = (event.rect.width - event.deltaRect.width) / zoom;
              const frameScale = typeof (event as any).scale === 'number' ? (event as any).scale : prevW > 0 ? currW / prevW : 1;
              const newScale = base.scale * frameScale;
              const nx = base.x + event.deltaRect.left / zoom;
              const ny = base.y + event.deltaRect.top / zoom;
              updateEntryPartial(props.entry.id, { x: nx, y: ny, scale: newScale });
            },
          },
          preserveAspectRatio: true,
          modifiers: [
            // aspect ratio
            interact.modifiers.aspectRatio({ ratio: imageRef.naturalWidth / imageRef.naturalHeight || imageRef.clientWidth / imageRef.clientHeight }),
          ],
        })
        .draggable({
          listeners: {
            move(event) {
              if (!stateStore.selected) return;
              const base = getEntry(props.entry.id) ?? props.entry;
              const nx = base.x + event.dx / interactStore.zoom;
              const ny = base.y + event.dy / interactStore.zoom;
              containerRef.style.transform = `translate(${nx}px, ${ny}px)`;
              updateEntryPartial(props.entry.id, { x: nx, y: ny });
            },
            end(event) {
              if (!stateStore.selected) return;
              const base = getEntry(props.entry.id) ?? props.entry;
              updateEntryPartial(props.entry.id, { x: base.x, y: base.y });
            },
          },
        });

      imageRef.style.width = props.entry.width * props.entry.scale + 'px';
      imageRef.style.height = props.entry.height * props.entry.scale + 'px';
      svgRef.style.width = props.entry.width * props.entry.scale + 'px';
      svgRef.style.height = props.entry.height * props.entry.scale + 'px';
      containerRef.style.transform = `translate(${props.entry.x}px, ${props.entry.y}px)`;
    };
  });

  onCleanup(() => {
    if (onEntryChangedHandler) eventBus.off('imagePool:entryPropChanged', onEntryChangedHandler);
  });

  const Handle: Component<{ x: string; y: string; 'data-pos': string; size?: number }> = (props) => {
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
        pointer-events='all'
        shape-rendering='geometricPrecision'
        style={{
          transform: `translate(-${size() / 2}px, -${size() / 2}px)`,
          position: 'absolute',
        }}
      />
    );
  };

  return (
    <div
      id={props.entry.id}
      ref={(el) => (containerRef = el)}
      style={{
        display: 'flex',
        position: 'absolute',
        'pointer-events': 'all',
        'box-sizing': 'border-box',
        'touch-action': 'none',
        'transform-origin': '0 0',
        margin: 0,
        padding: 0,
      }}
      tabindex={props.index}
      onClick={(e) => {
        e.currentTarget.focus();
      }}
      onBlur={(e) => {
        setStateStore('selected', false);
      }}
      onFocus={(e) => {
        setStateStore('selected', true);
      }}
      // onContextMenu={async (e) => {
      //   e.preventDefault();
      //   (await ImagePoolEntryMenu.create(props.entry.id)).show();
      // }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        showContextMenu(
          props.entry.fileName,
          [
            {
              ...ContextMenuItems.BaseRemove,
              onSelect: () => removeEntry(props.entry.id),
            },
            {
              ...ContextMenuItems.BaseBurndown,
              onSelect: () => burndownToCurrentLayer(props.entry.id, false),
            },
            {
              ...ContextMenuItems.BaseBurndownRemove,
              onSelect: () => burndownToCurrentLayer(props.entry.id, true),
            },
          ],
          e
        );
      }}
    >
      <img
        ref={(el) => (imageRef = el)}
        src={convertFileSrc(props.entry.originalPath)}
        width={props.entry.width}
        height={props.entry.height}
        style={{
          margin: 0,
          padding: 0,
          width: `${props.entry.width}px`,
          height: `${props.entry.height}px`,
          opacity: stateStore.visible ? 1 : 0.6,
          'z-index': Consts.zIndex.imagePoolImage,
        }}
      />

      <svg
        xmlns='http://www.w3.org/2000/svg'
        ref={(el) => (svgRef = el)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          margin: 0,
          padding: 0,
          'pointer-events': 'none',
          'image-rendering': 'pixelated',
          'shape-rendering': 'geometricPrecision',
          overflow: 'visible',
          visibility: stateStore.selected ? 'visible' : 'collapse',
          'z-index': Consts.zIndex.imagePoolControl,
        }}
      >
        {/* border rect */}
        <rect class={'border-rect'} width={'100%'} height={'100%'} fill='none' stroke='black' stroke-width={1 / interactStore.zoom} />
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
