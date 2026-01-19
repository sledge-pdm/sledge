import { Component, For } from 'solid-js';

import { projectStore } from '~/stores/RuntimeProjectStore';
import Image from './Image';

export const ImagePool: Component = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${projectStore.canvas.size.width}px`,
        height: `${projectStore.canvas.size.height}px`,
        'z-index': 'var(--zindex-image-pool)',
        'pointer-events': 'none',
        'touch-action': 'none',
      }}
    >
      <For each={projectStore.imagePool.entries}>{(entry, i) => entry && <Image entry={entry} index={i()} />}</For>
    </div>
  );
};
