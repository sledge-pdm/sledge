import { Component, For } from 'solid-js';
import { isImagePoolActive } from '~/controllers/layer/LayerListController';
import { Consts } from '~/models/Consts';
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
        'z-index': Consts.zIndex.imagePool,
        'pointer-events': 'none',
        'touch-action': 'none',
      }}
    >
      <For each={imagePoolStore.entries.values().toArray()}>
        {(entry, i) => {
          console.log(entry);
          if (entry === undefined) return;

          return <Image entry={entry} index={i()} />;
        }}
      </For>
    </div>
  );
};
