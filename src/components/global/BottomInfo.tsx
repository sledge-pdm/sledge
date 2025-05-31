import { Component } from 'solid-js';
import ThemeToggle from '~/components/common/ThemeToggle';
import { interactStore, logStore } from '~/stores/EditorStores';

import {
  bottomInfoContainer,
  bottomInfoContainerRight,
  bottomInfoRoot,
  bottomInfoText as bottomInfoTextStyle,
} from '~/styles/globals/bottom_info.css';
import { openWindow } from '~/utils/WindowUtils';

const BottomInfo: Component = () => {
  return (
    <div class={bottomInfoRoot} style={{ width: `${interactStore.canvasAreaSize.width}px` }}>
      <div class={bottomInfoContainer}>
        <a class={bottomInfoTextStyle} style={{ 'pointer-events': 'all', cursor: 'pointer' }} onClick={() => openWindow('about')}>
          sledge.
        </a>
        <p class={bottomInfoTextStyle}>x{interactStore.zoom}</p>
        <p class={bottomInfoTextStyle}>{logStore.bottomBarText}</p>
        <div class={bottomInfoContainerRight}>
          {/* <p class={bottomInfoTextStyle}>theme</p> */}
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default BottomInfo;
