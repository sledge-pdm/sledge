import { color, spacing } from '@sledge/theme';
import { Icon, ToggleSwitch } from '@sledge/ui';
import { Component } from 'solid-js';
import { addToImagePool } from '~/features/image_pool';
import { openImageImportDialog } from '~/features/io/image_pool/import';
import { isImagePoolActive, setImagePoolActive } from '~/features/layer';
import { flexCol, flexRow } from '~/styles';

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
          gap: spacing.md,
          'margin-left': spacing.xs,
          'margin-right': spacing.xs,
          cursor: 'pointer',
          'pointer-events': isImagePoolActive() ? 'all' : 'none',
        }}
      >
        <Icon
          src={'/icons/misc/add_image.png'}
          base={16}
          color={color.onBackground}
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
