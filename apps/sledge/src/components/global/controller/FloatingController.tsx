import { css } from '@acab/ecsstatic';
import { Vec2 } from '@sledge/core';
import { Icon } from '@sledge/ui';
import { Component, createSignal, onMount } from 'solid-js';

const root = css`
  position: fixed;
  display: flex;
  flex-direction: column;
  background-color: #000000a0;
  border: 1px solid var(--color-border);
  z-index: var(--zindex-floating-controller);
`;
const titlebar = css`
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 6px;
  justify-content: end;
  border-bottom: 1px solid var(--color-border-secondary);
`;

const controlContainer = css`
  display: flex;
  flex-direction: row;
  gap: 12px;
  padding: 12px;
`;
const iconContainer = css`
  cursor: pointer;
`;
const panContainer = css`
  position: relative;
  display: flex;
  flex-direction: column;
  border: 2px solid white;
  width: 48px;
  height: 48px;
`;
const panStick = css`
  position: absolute;
  padding: 8px;
  background-color: white;
  width: 20px;
  height: 20px;
  cursor: pointer;
  transform: translate(-50%, -50%);
`;
const zoomContainer = css`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 20px;
  height: 48px;
  align-items: center;
`;
const zoomBackground = css`
  background-color: white;
  width: 2px;
  height: 100%;
`;
const zoomHandle = css`
  position: absolute;
  background-color: white;
  width: 20px;
  height: 4px;
  transform: translateY(-50%);
  cursor: pointer;
`;

// floating(movable) canvas pan/zoom controller that imitates analog sticks by 2d pixels
const FloatingController: Component = () => {
  const [position, setPosition] = createSignal<Vec2>({ x: 0, y: 0 });
  const [positionLocked, setPositionLocked] = createSignal(false);

  onMount(() => {
    const sectionsBetweenArea = document.getElementById('sections-between-area');
    const areaRect = sectionsBetweenArea?.getBoundingClientRect();
    if (areaRect) {
      const margin = 16;
      setPosition({ x: areaRect.x + margin, y: areaRect.y + margin });
    }
  });

  return (
    <div
      class={root}
      style={{
        left: `${position().x}px`,
        top: `${position().y}px`,
      }}
    >
      <div class={titlebar}>
        <div
          class={iconContainer}
          onClick={() => {
            setPositionLocked(!positionLocked());
          }}
        >
          <Icon src={positionLocked() ? '/icons/misc/lock_closed.png' : '/icons/misc/lock_opened.png'} base={8} />
        </div>
        <div
          class={iconContainer}
          onClick={() => {
            setPositionLocked(!positionLocked());
          }}
        >
          <Icon src={'/icons/misc/remove.png'} base={8} />
        </div>
      </div>
      <div class={controlContainer}>
        {/* パンを操作するスティック 緩やかに傾き(Stickの単なる2D移動だけでOK)、移動量に応じてパン 離すとゆっくり真ん中に戻る */}
        <div class={panContainer}>
          <div class={panStick}></div>
        </div>
        {/* ズームを操作するつまみ(フェーダ) 移動量に応じてズーム 離すとゆっくり真ん中(top:50%)に戻る */}
        <div class={zoomContainer}>
          <div class={zoomBackground}></div>
          <div class={zoomHandle}></div>
        </div>
      </div>
    </div>
  );
};

export default FloatingController;
