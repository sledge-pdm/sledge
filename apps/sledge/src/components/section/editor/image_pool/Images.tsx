import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { Checkbox } from '@sledge/ui';
import { Component, createMemo, JSX, Show } from 'solid-js';
import ImagePoolGrid from '~/components/section/editor/image_pool/ImagePoolGrid';
import SectionItem from '~/components/section/SectionItem';
import { sectionContent } from '~/components/section/SectionStyles';
import { addImagesFromLocal, getEntry, ImagePoolEntry, removeEntry } from '~/features/image_pool';
import { openImageImportDialog } from '~/features/io/image_pool/import';
import { imagePoolStore, setImagePoolStore } from '~/stores/ProjectStores';

const imagesSectionsContent = css`
  margin-top: 8px;
  padding-left: 8px;
`;

const gridContainer = css`
  margin: 4px 0;
`;

const optionsContainer = css`
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  gap: 8px;
`;
const infoContainer = css`
  display: flex;
  flex-direction: column;
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

  return (
    <SectionItem
      title='images.'
      subHeaderIcons={[
        {
          src: '/icons/misc/add.png',
          onClick: async () => {
            const path = await openImageImportDialog();
            if (path !== undefined) {
              addImagesFromLocal(path);
            }
          },
        },
        {
          src: '/icons/misc/minus.png',
          onClick: async () => {
            const id = selectedEntry()?.id;
            if (id) removeEntry(id);
          },
          disabled: selectedEntry() === undefined,
        },
      ]}
    >
      <div class={clsx('ignore-image-select', sectionContent, imagesSectionsContent)}>
        <Show when={imagePoolStore.entries.length > 0} fallback={<p class={noImageText}>no images</p>}>
          <div class={gridContainer}>
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
              <div class={infoContainer}>
                <InfoRow label='image size'>
                  {selectedEntry()?.base.width}, {selectedEntry()?.base.height}
                </InfoRow>
                <InfoRow label='offset'>
                  {selectedEntry()?.transform.x.toFixed(2)}, {selectedEntry()?.transform.y.toFixed(2)}
                </InfoRow>
                <InfoRow label='scale'>
                  {selectedEntry()?.transform.scaleX.toFixed(2)}, {selectedEntry()?.transform.scaleY.toFixed(2)}
                </InfoRow>
                <InfoRow label='rotation'>{selectedEntry()?.transform.rotation.toFixed(1)}</InfoRow>
              </div>
            </div>
          </Show>
        </Show>
      </div>
    </SectionItem>
  );
};

const rowRoot = css`
  display: flex;
  flex-direction: row;
`;
const infoRowLabel = css`
  font-family: ZFB03;
  color: var(--color-muted);
  width: 80px;
`;

const infoRowValue = css`
  font-family: ZFB03;
  color: var(--color-muted);
  flex-grow: 1;
`;

interface InfoRowProps {
  label: string;
  children: JSX.Element | JSX.ArrayElement;
}
const InfoRow: Component<InfoRowProps> = (props) => {
  return (
    <div class={rowRoot}>
      <p class={infoRowLabel}>{props.label}</p>
      <p class={infoRowValue}>{props.children}</p>
    </div>
  );
};

export default Images;
