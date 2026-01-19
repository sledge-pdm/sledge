import { Component, For } from 'solid-js';

import { isImagePoolActive } from '~/features/layer';
import { imagePoolStore } from '~/stores/ProjectStores';
import { projectStore } from '~/stores/RuntimeProject';
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
        visibility: !isImagePoolActive() ? 'collapse' : 'visible',
        'z-index': 'var(--zindex-image-pool)',
        'pointer-events': 'none',
        'touch-action': 'none',
      }}
    >
      <For each={imagePoolStore.entries}>{(entry, i) => entry && <Image entry={entry} index={i()} />}</For>
    </div>
  );
};
