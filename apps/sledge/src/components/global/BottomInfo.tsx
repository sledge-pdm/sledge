import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Slider } from '@sledge/ui';
import { Component } from 'solid-js';
import ThemeToggle from '~/components/global/ThemeToggle';
import { setRotation } from '~/controllers/canvas/CanvasController';
import { interactStore, logStore } from '~/stores/EditorStores';

import { bottomInfoContainer, bottomInfoContainerRight, bottomInfoRoot, bottomInfoText } from '~/styles/globals/bottom_info.css';

const BottomInfo: Component = () => {
  return (
    <div class={bottomInfoRoot}>
      <div class={bottomInfoContainer}>
        <p class={bottomInfoText} style={{ width: '56px' }}>
          x{interactStore.zoom}
        </p>
        <p class={bottomInfoText} style={{ color: vars.color.muted, overflow: 'hidden', 'white-space': 'nowrap', 'text-overflow': 'ellipsis' }}>
          {logStore.bottomBarText}
        </p>
        <div class={bottomInfoContainerRight}>
          <div class={flexRow} style={{ width: '150px', overflow: 'visible' }}>
            <Slider
              labelMode='left'
              value={interactStore.rotation}
              min={-180}
              max={180}
              wheelSpin={true}
              allowFloat={false}
              customFormat='[value]°'
              onChange={(v) => setRotation(v)}
              onPointerDownOnValidArea={(e) => {
                if (e.ctrlKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  setRotation(0);
                  return false;
                }
                return true;
              }}
            />
          </div>
          {/* <p class={bottomInfoText}>theme</p> */}
          <ThemeToggle noBackground={true} />
        </div>
      </div>
    </div>
  );
};

export default BottomInfo;
