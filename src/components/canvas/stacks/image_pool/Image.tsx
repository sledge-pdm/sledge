import { convertFileSrc } from '@tauri-apps/api/core';
import interact from 'interactjs';
import { Component, createSignal, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { removeEntry, setEntry } from '~/controllers/canvas/image_pool/ImagePoolController';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { ImagePoolEntryMenu } from '~/models/menu/ImagePoolEntryMenu';
import { interactStore } from '~/stores/EditorStores';
import { imagePoolStore } from '~/stores/ProjectStores';
import { flexRow } from '~/styles/snippets.css';

const Image: Component<{ entry: ImagePoolEntry; index: number }> = (props) => {
  const [stateStore, setStateStore] = createStore({
    selected: false,
    x: 0,
    y: 0,
    scale: 0,
  });

  let containerRef: HTMLDivElement;
  let imageRef: HTMLImageElement;
  let svgRef: SVGSVGElement;

  let origEntry = props.entry;
  let [localEntry, setLocalEntry] = createSignal(imagePoolStore.entries.get(props.entry.id)!);

  onMount(() => {
    imageRef.onload = () => {
      interact(containerRef)
        .resizable({
          edges: { top: true, left: true, bottom: true, right: true },
          allowFrom: '.resize-handle',
          listeners: {
            start(event) {
              origEntry = imagePoolStore.entries.get(props.entry.id)!;
              setLocalEntry(origEntry);
            },
            move(event) {
              const zoom = interactStore.zoom;
              const newWidth = event.rect.width / zoom;
              const newHeight = event.rect.height / zoom;
              const newScale = event.scale * origEntry.scale;

              containerRef.style.width = newWidth + 'px';
              containerRef.style.height = newHeight + 'px';

              setLocalEntry((le) => {
                le.x += event.deltaRect.left / zoom;
                le.y += event.deltaRect.top / zoom;
                le.scale = newScale;
                return le;
              });
              setEntry(props.entry.id, localEntry());
              containerRef.style.transform = `translate(${localEntry().x}px, ${localEntry().y}px)`;
            },
            end(event) {
              setEntry(props.entry.id, localEntry());
            },
          },
          preserveAspectRatio: true,
          modifiers: [
            // aspect ratio
            interact.modifiers.aspectRatio({ ratio: imageRef.clientWidth / imageRef.clientHeight }),
          ],
        })
        .draggable({
          listeners: {
            start(event) {},
            move(event) {
              setLocalEntry((le) => {
                le.x += event.dx / interactStore.zoom;
                le.y += event.dy / interactStore.zoom;
                return le;
              });
              setEntry(props.entry.id, localEntry());

              containerRef.style.transform = `translate(${localEntry().x}px, ${localEntry().y}px)`;
            },
            end(event) {
              setEntry(props.entry.id, localEntry());
            },
          },
        });

      containerRef.style.width = imageRef.clientWidth + 'px';
      containerRef.style.height = imageRef.clientHeight + 'px';
    };
  });

  const Handle: Component<{ x: string; y: string; 'data-pos': string; size?: number }> = (props) => {
    const size = () => (props.size ?? 5) / interactStore.zoom;
    return (
      <rect
        x={props.x}
        y={props.y}
        class={'resize-handle'}
        data-pos={props['data-pos']}
        width={size()}
        height={size()}
        fill='black'
        pointer-events='all'
        shape-rendering='geometricPrecision'
        style={{
          transform: `translate(-${size() / 2}px, -${size() / 2}px)`,
          position: 'absolute',
          'z-index': 400,
        }}
      />
    );
  };

  return (
    <div
      id={props.entry.id}
      ref={(el) => (containerRef = el)}
      style={{
        position: 'absolute',
        'pointer-events': 'all',
        'box-sizing': 'border-box',
        'touch-action': 'none',
        'transform-origin': '0 0',
        overflow: 'visible',
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
      onContextMenu={async (e) => {
        e.preventDefault();
        (await ImagePoolEntryMenu.create(props.entry.id)).show();
      }}
    >
      <img
        ref={(el) => (imageRef = el)}
        src={convertFileSrc(props.entry.resourcePath)}
        style={{
          width: '100%',
          height: 'fit-content',
          margin: 0,
          padding: 0,
          opacity: localEntry().visible ? 1 : 0.2,
          'z-index': 2,
          'pointer-events': 'none',
        }}
      />

      <svg
        xmlns='http://www.w3.org/2000/svg'
        ref={(el) => (svgRef = el)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0,
          'pointer-events': 'none',
          'image-rendering': 'pixelated',
          'shape-rendering': 'geometricPrecision',
          overflow: 'visible',
          visibility: stateStore.selected ? 'visible' : 'collapse',
        }}
      >
        {/* border rect */}
        <rect width={'100%'} height={'100%'} fill='none' stroke='black' stroke-width={1 / interactStore.zoom} shape-rendering='geometricPrecision' />
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

      <div
        class={flexRow}
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: 'fit-content',
          height: 'fit-content',
          gap: '12px',
          padding: '4px',
          'margin-bottom': '12px',
          'pointer-events': 'none',
          'background-color': '#FFFFFF',
          border: '1px solid black',
          visibility: stateStore.selected ? 'visible' : 'collapse',
          'transform-origin': '100% 0',
          transform: `scale(${1 / interactStore.zoom})`,
          'z-index': 1000,
        }}
      >
        <img
          src='/icons/misc/invisible.png'
          onClick={() => {
            setLocalEntry((le) => {
              le.visible = !le.visible;
              return le;
            });
            setEntry(props.entry.id, localEntry());
          }}
          style={{
            width: '12px',
            height: '12px',
            'pointer-events': 'all',
            cursor: 'pointer',
          }}
        />
        <img
          src='/icons/misc/burndown.png'
          onClick={() => {}}
          style={{
            width: '12px',
            height: '12px',
            'pointer-events': 'all',
            cursor: 'pointer',
          }}
        />
        <img
          src='/icons/misc/garbage.png'
          onClick={() => {
            removeEntry(props.entry.id);
          }}
          style={{
            width: '12px',
            height: '12px',
            'pointer-events': 'all',
            cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );
};

export default Image;
