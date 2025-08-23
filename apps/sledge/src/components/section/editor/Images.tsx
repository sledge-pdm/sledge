import { flexRow } from '@sledge/core';
import { Component } from 'solid-js';
import SectionItem from '~/components/section/SectionItem';
import { openImageImportDialog } from '~/controllers/canvas/image_pool/ImageImport';
import { addToImagePool } from '~/controllers/canvas/image_pool/ImagePoolController';
import ImagePoolList from './ImagePoolList';

const Images: Component<{}> = () => {
  return (
    <SectionItem title='images.'>
      <div
        class={flexRow}
        style={{
          'margin-left': 'auto',
          gap: '4px',
        }}
      >
        <button
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
        <ImagePoolList />
      </div>
    </SectionItem>
  );
};

export default Images;
