import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { convertFileSrc } from '@tauri-apps/api/core';
import interact from 'interactjs';
import { Component, createSignal, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { burndownToLayer } from '~/appliers/ImageBurndownApplier';
import { removeEntry, setEntry } from '~/controllers/canvas/image_pool/ImagePoolController';
import { activeLayer } from '~/controllers/layer/LayerListController';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { Consts } from '~/models/Consts';
import { ImagePoolEntryMenu } from '~/models/menu/ImagePoolEntryMenu';
import { interactStore } from '~/stores/EditorStores';
import { imagePoolStore } from '~/stores/ProjectStores';

const Image: Component<{ entry: ImagePoolEntry; index: number }> = (props) => {
  const [stateStore, setStateStore] = createStore({
    selected: false,
    visible: props.entry.visible,
  });

  let containerRef: HTMLDivElement;
  let imageRef: HTMLImageElement;
  let svgRef: SVGSVGElement;

  let [localEntry, setLocalEntry] = createSignal<ImagePoolEntry>(props.entry);

  onMount(() => {
    imageRef.onload = () => {
      interact(containerRef)
        .resizable({
          edges: { top: true, left: true, bottom: true, right: true },
          allowFrom: '.resize-handle',
          listeners: {
            move(event) {
              if (!stateStore.selected) return;

              const entry = imagePoolStore.entries.get(props.entry.id)!;
              const zoom = interactStore.zoom;
              const newWidth = event.rect.width / zoom;
              const newHeight = event.rect.height / zoom;
              const newScale = event.rect.width / entry.width;

              imageRef.style.width = newWidth + 'px';
              imageRef.style.height = newHeight + 'px';
              svgRef.style.width = newWidth + 'px';
              svgRef.style.height = newHeight + 'px';

              setLocalEntry((le) => {
                le.x += event.deltaRect.left / zoom;
                le.y += event.deltaRect.top / zoom;
                le.scale = newScale / zoom;
                return le;
              });
              setEntry(props.entry.id, localEntry());
              containerRef.style.transform = `translate(${localEntry().x}px, ${localEntry().y}px)`;
            },
            end(event) {
              if (!stateStore.selected) return;
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
            move(event) {
              if (!stateStore.selected) return;
              setLocalEntry((le) => {
                le.x += event.dx / interactStore.zoom;
                le.y += event.dy / interactStore.zoom;
                return le;
              });
              setEntry(props.entry.id, localEntry());

              containerRef.style.transform = `translate(${localEntry().x}px, ${localEntry().y}px)`;
            },
            end(event) {
              if (!stateStore.selected) return;
              setEntry(props.entry.id, localEntry());
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

  const handleBurndown = async () => {
    const active = activeLayer(); // いま選択中のレイヤー
    if (!active) return;

    try {
      await burndownToLayer({
        entry: props.entry,
        targetLayerId: active.id,
      });
      removeEntry(props.entry.id); // ImagePool から削除
    } catch (e) {
      console.error(e);
      // TODO: ユーザ通知
    }
  };

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
          'z-index': Consts.zIndex.imagePoolHandle,
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
        width={props.entry.width}
        height={props.entry.height}
        style={{
          margin: 0,
          padding: 0,
          width: `${props.entry.width}px`,
          height: `${props.entry.height}px`,
          opacity: localEntry().visible ? 1 : 0.6,
          'z-index': Consts.zIndex.imagePool,
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
        <rect
          class={'border-rect'}
          width={'100%'}
          height={'100%'}
          fill='none'
          stroke='black'
          stroke-width={1 / interactStore.zoom}
          style={{
            'z-index': Consts.zIndex.imagePoolBorder,
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

      <div
        class={flexRow}
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          gap: '8px',
          padding: '2px',
          'margin-bottom': '12px',
          'pointer-events': 'none',
          'image-rendering': 'auto',
          'background-color': vars.color.onBackground,
          border: '1px solid black',
          visibility: stateStore.selected ? 'visible' : 'collapse',
          'transform-origin': '100% 0',
          transform: `scale(${1 / interactStore.zoom})`,
          'z-index': Consts.zIndex.imagePoolMenu,
        }}
      >
        <img
          src={stateStore.visible ? '/icons/image_pool/hide.png' : '/icons/image_pool/show.png'}
          onClick={(e) => {
            let le = localEntry();
            le.visible = le.visible ? false : true;
            setLocalEntry(le);
            setStateStore('visible', le.visible);
            setEntry(props.entry.id, le);
          }}
          width={12}
          height={12}
          style={{
            width: '12px',
            height: '12px',
            margin: '2px',
            'pointer-events': 'all',
            cursor: 'pointer',
          }}
        />
        <img
          src='/icons/image_pool/burndown.png'
          onClick={handleBurndown}
          width={12}
          height={12}
          style={{
            width: '12px',
            height: '12px',
            margin: '2px',
            'pointer-events': 'all',
            cursor: 'pointer',
          }}
        />
        <img
          src='/icons/image_pool/remove.png'
          onClick={() => {
            removeEntry(props.entry.id);
          }}
          width={12}
          height={12}
          style={{
            width: '12px',
            height: '12px',
            margin: '2px',
            'pointer-events': 'all',
            cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );
};

export default Image;
