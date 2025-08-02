import { flexRow } from '@sledge/core';
import { Slider } from '@sledge/ui';
import { Component } from 'solid-js';
import ThemeToggle from '~/components/global/ThemeToggle';
import { interactStore, logStore, setInteractStore } from '~/stores/EditorStores';

import {
  bottomInfoContainer,
  bottomInfoContainerRight,
  bottomInfoRoot,
  bottomInfoText as bottomInfoTextStyle,
} from '~/styles/globals/bottom_info.css';

const BottomInfo: Component = () => {
  return (
    <div class={bottomInfoRoot} style={{}}>
      <div class={bottomInfoContainer}>
        {/* <a class={bottomInfoTextStyle} style={{ 'pointer-events': 'all', cursor: 'pointer' }} onClick={() => openWindow('about')}>
          sledge.
        </a> */}
        <p class={bottomInfoTextStyle}>x{interactStore.zoom}</p>
        <p class={bottomInfoTextStyle} style={{ overflow: 'hidden', 'white-space': 'nowrap', 'text-overflow': 'ellipsis' }}>
          {logStore.bottomBarText}
        </p>
        <div class={bottomInfoContainerRight}>
          <div class={flexRow} style={{ width: '200px' }}>
            <Slider
              labelMode='left'
              value={interactStore.rotation}
              min={-180}
              max={180}
              allowFloat={false}
              customFormat='[value]°'
              onChange={(v) => setInteractStore('rotation', v)}
              onPointerDownOnValidArea={(e) => {
                if (e.ctrlKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  setInteractStore('rotation', 0);
                  return false;
                }
                return true;
              }}
            />
          </div>
          {/* <p class={bottomInfoTextStyle}>theme</p> */}
          <ThemeToggle noBackground={true} />
        </div>
      </div>
    </div>
  );
};

export default BottomInfo;
