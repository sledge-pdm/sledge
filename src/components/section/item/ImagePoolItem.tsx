import * as styles from '@styles/section/item/image_pool_item.css';
import { Component } from 'solid-js';
import { isImagePoolActive, setImagePoolActive } from '~/controllers/canvas/layer/LayerController';
import { LayerMenu } from '~/models/menu/LayerMenu';
import { flexRow, w100 } from '~/styles/snippets.css';

const ImagePoolItem: Component<{}> = (props) => {
  const onDetClicked = (e: MouseEvent) => {
    setImagePoolActive(!isImagePoolActive());
  };

  return (
    <div
      class={styles.item}
      style={{ opacity: isImagePoolActive() ? 1 : 0.5 }}
      onClick={onDetClicked}
      onContextMenu={(e) => {
        e.preventDefault();
        new LayerMenu().show();
      }}
    >
      <div
        class={[flexRow, w100].join(' ')}
        style={{
          'align-items': 'center',
          position: 'relative',
        }}
      >
        <p class={styles.name}>IMAGE POOL</p>
      </div>
    </div>
  );
};

export default ImagePoolItem;
