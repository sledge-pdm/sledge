import { flexCol } from '@sledge/core';
import { Checkbox } from '@sledge/ui';
import { Component, createMemo, Show } from 'solid-js';
import ImagePoolGrid from '~/components/section/editor/item/ImagePoolGrid';
import SectionItem from '~/components/section/SectionItem';
import { addToImagePool, getEntry, ImagePoolEntry, removeEntry } from '~/features/image_pool';
import { openImageImportDialog } from '~/io/image_pool/import';
import { imagePoolStore, setImagePoolStore } from '~/stores/ProjectStores';
import { sectionContent } from '~/styles/section/section_item.css';

const Images: Component<{}> = () => {
  const selectedEntry = createMemo<ImagePoolEntry | undefined>(() =>
    imagePoolStore.selectedEntryId ? getEntry(imagePoolStore.selectedEntryId) : undefined
  );

  return (
    <SectionItem
      title='images.'
      subHeaderIcons={[
        {
          src: '/icons/misc/plus_12.png',
          onClick: async () => {
            const path = await openImageImportDialog();
            if (path !== undefined) {
              addToImagePool(path);
            }
          },
        },
        {
          src: '/icons/misc/minus_12.png',
          onClick: async () => {
            const id = selectedEntry()?.id;
            if (id) removeEntry(id);
          },
          disabled: selectedEntry() === undefined,
        },
      ]}
    >
      <div class={sectionContent}>
        <div style={{ margin: '4px 0' }}>
          {/* <ImagePoolList /> */}
          <ImagePoolGrid />
        </div>
        <Show when={imagePoolStore.selectedEntryId !== undefined}>
          <div
            class={flexCol}
            style={{
              'margin-top': '8px',
              gap: '4px',
            }}
          >
            <Checkbox
              checked={imagePoolStore.preserveAspectRatio}
              label='preserve ratio.'
              labelMode='right'
              onChange={(checked) => setImagePoolStore('preserveAspectRatio', checked)}
            />
          </div>
        </Show>
      </div>
    </SectionItem>
  );
};

export default Images;
