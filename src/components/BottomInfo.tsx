import { Component, createSignal } from 'solid-js';
import { AboutWindowOptions } from '~/routes/about';
import { canvasStore } from '~/stores/project/canvasStore';

import {
  bottomInfoRoot,
  bottomInfoText as bottomInfoTextStyle,
} from '~/styles/components/bottom_info.css';
import { openSingletonWindow } from '~/utils/windowUtils';

const [bottomInfoText, setBottomInfoText] = createSignal('');

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
      <p class={bottomInfoTextStyle}>x{canvasStore.zoom}</p>
      <p class={bottomInfoTextStyle}>{bottomInfoText()}</p>
    </div>
  );
};

export const setBottomInfo = (text: string) => {
  setBottomInfoText(text);
};

export default BottomInfo;
