import { Component, For, createSignal, onCleanup, onMount } from 'solid-js';
import { getEntries } from '~/controllers/canvas/image_pool/ImagePoolController';
import { isImagePoolActive } from '~/controllers/layer/LayerListController';
import { Consts } from '~/models/Consts';
import { canvasStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import Image from './Image';

export const ImagePool: Component = () => {
  const [entries, setEntries] = createSignal(getEntries());

  const handleEntriesChanged = (e: { newEntries: ReturnType<typeof getEntries> }) => {
    setEntries(e.newEntries);
  };

  onMount(() => {
    eventBus.on('imagePool:entriesChanged', handleEntriesChanged);
  });
  onCleanup(() => {
    eventBus.off('imagePool:entriesChanged', handleEntriesChanged);
  });

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
      <For each={entries()}>{(entry, i) => entry && <Image entry={entry} index={i()} />}</For>
    </div>
  );
};
