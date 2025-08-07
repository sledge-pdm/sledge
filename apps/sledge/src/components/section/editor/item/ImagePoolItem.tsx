import { flexCol, flexRow, w100 } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { item, name } from '@styles/section/editor/item/image_pool_item.css';
import { Component } from 'solid-js';
import { openImageImportDialog } from '~/controllers/canvas/image_pool/ImageImport';
import { addToImagePool } from '~/controllers/canvas/image_pool/ImagePoolController';
import { isImagePoolActive, setImagePoolActive } from '~/controllers/layer/LayerListController';

const ImagePoolItem: Component = () => {
  const onDetClicked = (e: MouseEvent) => {
    setImagePoolActive(!isImagePoolActive());
  };

  return (
    <div class={item} style={{ opacity: isImagePoolActive() ? 1 : 0.3 }} onClick={onDetClicked}>
      <div
        class={[flexRow, w100].join(' ')}
        style={{
          'align-items': 'center',
          position: 'relative',
        }}
      >
        <p class={name} style={{ 'text-decoration': isImagePoolActive() ? 'none' : 'line-through' }}>
          IMAGE POOL.
        </p>
      </div>
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
