import * as styles from '@styles/section/item/image_pool_item.css';
import { Component } from 'solid-js';
import { isImagePoolActive, setImagePoolActive } from '~/controllers/layer/LayerListController';
import { flexRow, w100 } from '~/styles/snippets.css';

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
          IMAGE POOL.{isImagePoolActive() ? '' : ''}
        </p>
      </div>
    </div>
  );
};

export default ImagePoolItem;
