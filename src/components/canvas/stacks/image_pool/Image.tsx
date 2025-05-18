import { convertFileSrc } from '@tauri-apps/api/core';
import { Component, onCleanup, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import ImageInteract from '~/controllers/canvas/image_pool/ImageInteract';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { ImagePoolEntryMenu } from '~/models/menu/ImagePoolEntryMenu';

const Image: Component<{ entry: ImagePoolEntry; index: number }> = (props) => {
  const [stateStore, setStateStore] = createStore({
    selected: false,
  });

  let containerRef: HTMLDivElement;
  let imageInteract: ImageInteract;

  onMount(() => {
    imageInteract = new ImageInteract(containerRef, props.entry.id);
    imageInteract.setInteractListeners();
  });

  onCleanup(() => imageInteract.removeInteractListeners());

  return (
    <div
      ref={(el) => (containerRef = el)}
      style={{
        position: 'absolute',
        padding: 0,
        margin: 0,
        transform: `translate(${props.entry.x}px, ${props.entry.y}px)`,
        'transform-origin': '0 0',
        border: stateStore.selected ? '1px solid black' : undefined,
        'pointer-events': 'all',
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
      <img src={convertFileSrc(props.entry.resourcePath)} style={{ 'pointer-events': 'none' }}></img>
    </div>
  );
};

export default Image;
