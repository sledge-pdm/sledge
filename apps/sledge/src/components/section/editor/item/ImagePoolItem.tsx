import { flexCol, flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Icon, ToggleSwitch } from '@sledge/ui';
import { Component } from 'solid-js';
import { openImageImportDialog } from '~/controllers/canvas/image_pool/ImageImport';
import { addToImagePool } from '~/controllers/canvas/image_pool/ImagePoolController';
import { isImagePoolActive, setImagePoolActive } from '~/controllers/layer/LayerListController';

const ImagePoolItem: Component = () => {
  return (
    <div class={flexRow} style={{ gap: '12px', 'align-items': 'center' }}>
      <ToggleSwitch
        checked={isImagePoolActive()}
        onChange={(e) => {
          setImagePoolActive(e);
        }}
        labelMode='right'
      />
      <div
        class={flexCol}
        style={{
          width: '16px',
          height: '16px',
          'justify-content': 'center',
          'align-items': 'center',
          gap: vars.spacing.md,
          'margin-left': vars.spacing.xs,
          'margin-right': vars.spacing.xs,
          cursor: 'pointer',
          'pointer-events': isImagePoolActive() ? 'all' : 'none',
        }}
      >
        <Icon
          src={'/icons/misc/add_image.png'}
          base={16}
          color={vars.color.onBackground}
          onClick={async (e) => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            const path = await openImageImportDialog();
            if (path !== undefined) {
              addToImagePool(path);
            }
          }}
        >
          + add.
        </Icon>
      </div>
    </div>
  );
};

export default ImagePoolItem;
