import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Slider } from '@sledge/ui';
import { Component, createEffect, createMemo, onMount } from 'solid-js';
import ThemeToggle from '~/components/global/ThemeToggle';
import { setRotation } from '~/features/canvas';
import { resetBottomBarText } from '~/features/log/service';
import { interactStore, logStore, toolStore } from '~/stores/EditorStores';

const bottomInfoRoot = css`
  display: flex;
  flex-direction: row;
  box-sizing: content-box;
  flex-wrap: wrap;
  background-color: var(--color-background);
  border-top: 1px solid var(--color-border);
  height: 20px;
  z-index: var(--zindex-bottom-info);
  pointer-events: all;
  overflow-y: visible;
`;

const bottomInfoContainer = css`
  display: flex;
  flex-direction: row;
  height: 20px;
  width: 100%;
  align-items: center;
  padding-left: var(--spacing-md);
  gap: var(--spacing-md);
`;

const bottomInfoContainerRight = css`
  display: flex;
  flex-direction: row;
  height: 20px;
  flex-grow: 1;
  align-items: center;
  justify-content: end;
  gap: var(--spacing-md);
  overflow: visible;
`;

const sliderContainer = css`
  display: flex;
  flex-direction: row;
  width: 140px;
  overflow: visible;
`;

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
        return color.onBackground;
      case 'warn':
        return color.warn;
      case 'error':
        return color.error;
    }
  });

  return (
    <div id='bottom-info' class={bottomInfoRoot}>
      <div class={bottomInfoContainer}>
        {/** <p style={{ width: '56px' }}>x{interactStore.zoomByReference}</p> */}
        <p style={{ color: textColor(), overflow: 'hidden', 'white-space': 'nowrap', 'text-overflow': 'ellipsis' }}>{logStore.bottomBarText}</p>
        <div class={bottomInfoContainerRight}>
          <div class={sliderContainer}>
            <Slider
              labelMode='left'
              value={interactStore.rotation}
              min={-180}
              max={180}
              floatSignificantDigits={1}
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
