import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Slider } from '@sledge/ui';
import { Component, createEffect, createMemo, onMount } from 'solid-js';
import ThemeToggle from '~/components/global/ThemeToggle';
import { setRotation } from '~/features/canvas';
import { resetBottomBarText } from '~/features/log/service';
import { interactStore, logStore, toolStore } from '~/stores/EditorStores';

import { bottomInfoContainer, bottomInfoContainerRight, bottomInfoRoot } from '~/styles/globals/bottom_info.css';

const BottomInfo: Component = () => {
  onMount(() => {
    resetBottomBarText();
  });

  createEffect(() => {
    toolStore.activeToolCategory;
    resetBottomBarText();
  });

  const textColor = createMemo<string>(() => {
    switch (logStore?.bottomBarKind) {
      case 'info':
      default:
        return vars.color.onBackground;
      case 'warn':
        return vars.color.warn;
      case 'error':
        return vars.color.error;
    }
  });

  return (
    <div id='bottom-info' class={bottomInfoRoot}>
      <div class={bottomInfoContainer}>
        {/** <p style={{ width: '56px' }}>x{interactStore.zoomByReference}</p> */}
        <p style={{ color: textColor(), overflow: 'hidden', 'white-space': 'nowrap', 'text-overflow': 'ellipsis' }}>{logStore.bottomBarText}</p>
        <div class={bottomInfoContainerRight}>
          <div class={flexRow} style={{ width: '140px', overflow: 'visible' }}>
            <Slider
              labelMode='left'
              value={interactStore.rotation}
              min={-180}
              max={180}
              wheelSpin={true}
              allowFloat={false}
              customFormat='[value]°'
              onChange={(v) => setRotation(v)}
              onDoubleClick={() => {
                setRotation(0);
              }}
              onPointerDownOnValidArea={(e) => {
                if (e.ctrlKey || e.metaKey) {
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
