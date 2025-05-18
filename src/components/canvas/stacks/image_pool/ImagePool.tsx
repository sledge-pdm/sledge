import { Component, For, onMount } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { imagePoolController } from '~/controllers/canvas/image_pool/ImagePoolController';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { canvasStore } from '~/stores/ProjectStores';
import { listenEvent } from '~/utils/TauriUtils';
import Image from './Image';

export const ImagePool: Component = () => {
  const [state, setState] = createStore<{ entries: Record<string, ImagePoolEntry> }>({
    entries: {},
  });

  const sync = () => {
    const map = imagePoolController.getEntries();
    const obj = Object.fromEntries(map.entries());
    setState('entries', reconcile(obj));
  };

  onMount(() => {
    sync();
    listenEvent('onImagePoolChanged', sync);
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${canvasStore.canvas.width}px`,
        height: `${canvasStore.canvas.height}px`,
        'z-index': '200',
        'pointer-events': 'none',
      }}
    >
      <For each={Object.values(state.entries)}>
        {(entry, i) => {
          if (entry === undefined) return;
          return <Image entry={entry} index={i()} />;
        }}
      </For>
    </div>
  );
};
