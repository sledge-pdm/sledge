import * as styles from '@styles/section/item/image_pool_item.css';
import { Component } from 'solid-js';
import Icon from '~/components/common/Icon';
import { openImageImportDialog } from '~/controllers/canvas/image_pool/ImageImport';
import { addToImagePool } from '~/controllers/canvas/image_pool/ImagePoolController';
import { isImagePoolActive, setImagePoolActive } from '~/controllers/layer/LayerListController';
import { vars } from '~/styles/global.css';
import { flexCol, flexRow, w100 } from '~/styles/snippets.css';

const ImagePoolItem: Component<{}> = (props) => {
  const onDetClicked = (e: MouseEvent) => {
    setImagePoolActive(!isImagePoolActive());
  };

  return (
    <div class={styles.item} style={{ opacity: isImagePoolActive() ? 1 : 0.3 }} onClick={onDetClicked}>
      <div
        class={[flexRow, w100].join(' ')}
        style={{
          'align-items': 'center',
          position: 'relative',
        }}
      >
        <p class={styles.name} style={{ 'text-decoration': isImagePoolActive() ? 'none' : 'line-through' }}>
          IMAGE POOL.
        </p>
      </div>
      <div
        class={flexCol}
        style={{
          'justify-content': 'center',
          'align-items': 'center',
          gap: vars.spacing.md,
          'margin-left': vars.spacing.xs,
          'margin-right': vars.spacing.sm,
          'padding-bottom': '5px',
          cursor: 'pointer',
          'pointer-events': isImagePoolActive() ? 'all' : 'none',
        }}
      >
        <Icon
          src={'/icons/misc/add_image.png'}
          base={16}
          onClick={async (e) => {
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
