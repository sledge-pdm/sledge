import { Component } from 'solid-js';
import { AboutWindowOptions } from '~/routes/about';
import { interactStore, logStore } from '~/stores/EditorStores';

import { bottomInfoRoot, bottomInfoText as bottomInfoTextStyle } from '~/styles/components/globals/bottom_info.css';
import { openSingletonWindow } from '~/utils/windowUtils';

const BottomInfo: Component = () => {
  return (
    <div class={bottomInfoRoot}>
      <a
        class={bottomInfoTextStyle}
        style={{ 'pointer-events': 'all', cursor: 'pointer' }}
        onClick={() => openSingletonWindow('about', AboutWindowOptions)}
      >
        sledge.
      </a>
      <p class={bottomInfoTextStyle}>x{interactStore.zoom}</p>
      <p class={bottomInfoTextStyle}>{logStore.bottomBarText}</p>
    </div>
  );
};

export default BottomInfo;
