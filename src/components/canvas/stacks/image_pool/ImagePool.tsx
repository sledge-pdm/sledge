import { Component, For } from 'solid-js';
import { isImagePoolActive } from '~/controllers/canvas/layer/LayerListController';
import { canvasStore, imagePoolStore } from '~/stores/ProjectStores';
import Image from './Image';

export const ImagePool: Component = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${canvasStore.canvas.width}px`,
        height: `${canvasStore.canvas.height}px`,
        visibility: !isImagePoolActive() ? 'collapse' : 'visible',
        'z-index': '200',
        'pointer-events': 'none',
      }}
    >
      <For each={imagePoolStore.entries.values().toArray()}>
        {(entry, i) => {
          if (entry === undefined) return;

          return <Image entry={entry} index={i()} />;
        }}
      </For>
    </div>
  );
};
