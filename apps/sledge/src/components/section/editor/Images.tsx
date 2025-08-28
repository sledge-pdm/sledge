import { flexRow } from '@sledge/core';
import { Checkbox } from '@sledge/ui';
import { Component } from 'solid-js';
import ImagePoolGrid from '~/components/section/editor/item/ImagePoolGrid';
import SectionItem from '~/components/section/SectionItem';
import { openImageImportDialog } from '~/controllers/canvas/image_pool/ImageImport';
import { addToImagePool } from '~/controllers/canvas/image_pool/ImagePoolController';
import { imagePoolStore, setImagePoolStore } from '~/stores/ProjectStores';
import { sectionContent } from '~/styles/section/section_item.css';

const Images: Component<{}> = () => {
  return (
    <SectionItem title='images.'>
      <div class={sectionContent}>
        <div
          class={flexRow}
          style={{
            gap: '4px',
          }}
        >
          <Checkbox
            checked={imagePoolStore.preserveAspectRatio}
            label='preserve ratio.'
            labelMode='right'
            onChange={(checked) => setImagePoolStore('preserveAspectRatio', checked)}
          />
          <button
            style={{
              'margin-left': 'auto',
            }}
            onClick={async () => {
              const path = await openImageImportDialog();
              if (path !== undefined) {
                addToImagePool(path);
              }
            }}
          >
            + add image.
          </button>
        </div>
        <div style={{ margin: '8px 0' }}>
          {/* <ImagePoolList /> */}
          <ImagePoolGrid />
        </div>
      </div>
    </SectionItem>
  );
};

export default Images;
