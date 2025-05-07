import { Component } from 'solid-js';
import { interactStore, logStore } from '~/stores/EditorStores';

import { bottomInfoRoot, bottomInfoText as bottomInfoTextStyle } from '~/styles/components/globals/bottom_info.css';
import { safeInvoke } from '~/utils/TauriUtils';

const BottomInfo: Component = () => {
  return (
    <div class={bottomInfoRoot}>
      <a
        class={bottomInfoTextStyle}
        style={{ 'pointer-events': 'all', cursor: 'pointer' }}
        onClick={() =>
          safeInvoke('open_window', {
            payload: {
              kind: 'about',
            },
          })
        }
      >
        sledge.
      </a>
      <p class={bottomInfoTextStyle}>x{interactStore.zoom}</p>
      <p class={bottomInfoTextStyle}>{logStore.bottomBarText}</p>
    </div>
  );
};

export default BottomInfo;
