import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { Checkbox } from '@sledge/ui';
import { Component, createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import ImagePoolGrid from '~/components/section/editor/image_pool/ImagePoolGrid';
import SectionItem from '~/components/section/SectionItem';
import { sectionContent } from '~/components/section/SectionStyles';
import { addToImagePool, getEntries, getEntry, ImagePoolEntry, removeEntry } from '~/features/image_pool';
import { openImageImportDialog } from '~/features/io/image_pool/import';
import { imagePoolStore, setImagePoolStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';

const imagesSectionsContent = css`
  padding-left: 8px;
`;

const gridContainer = css`
  margin: 4px 0;
`;

const optionsContainer = css`
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  gap: 4px;
`;

const noImageText = css`
  align-self: center;
  justify-self: center;
  color: var(--color-muted);
`;

const Images: Component<{}> = () => {
  const selectedEntry = createMemo<ImagePoolEntry | undefined>(() =>
    imagePoolStore.selectedEntryId ? getEntry(imagePoolStore.selectedEntryId) : undefined
  );
  const [entries, setEntries] = createSignal(getEntries());

  const handleEntriesChanged = (e: { newEntries: ReturnType<typeof getEntries> }) => {
    setEntries([...e.newEntries]);
  };

  onMount(() => {
    eventBus.on('imagePool:entriesChanged', handleEntriesChanged);
  });
  onCleanup(() => {
    eventBus.off('imagePool:entriesChanged', handleEntriesChanged);
  });

  return (
    <SectionItem
      title='images.'
      subHeaderIcons={[
        {
          src: '/icons/misc/add.png',
          onClick: async () => {
            const path = await openImageImportDialog();
            if (path !== undefined) {
              addToImagePool(path);
            }
          },
        },
        {
          src: '/icons/misc/remove_minus.png',
          onClick: async () => {
            const id = selectedEntry()?.id;
            if (id) removeEntry(id);
          },
          disabled: selectedEntry() === undefined,
        },
      ]}
    >
      <div class={clsx(sectionContent, imagesSectionsContent)}>
        <Show when={entries().length > 0} fallback={<p class={noImageText}>no images</p>}>
          <div class={gridContainer}>
            {/* <ImagePoolList /> */}
            <ImagePoolGrid />
          </div>
          <Show when={imagePoolStore.selectedEntryId !== undefined}>
            <div class={optionsContainer}>
              <Checkbox
                checked={imagePoolStore.preserveAspectRatio}
                label='preserve ratio.'
                labelMode='right'
                onChange={(checked) => setImagePoolStore('preserveAspectRatio', checked)}
              />
            </div>
          </Show>
        </Show>
      </div>
    </SectionItem>
  );
};

export default Images;
