import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component, createMemo } from 'solid-js';
import { resetOrientation, setRotation, toggleHorizontalFlip, toggleVerticalFlip } from '~/features/canvas';
import { appearanceStore, interactStore, setAppearanceStore } from '~/stores/EditorStores';

const iconContainer = css`
  display: flex;
  flex-direction: column;
  align-content: center;
  align-items: center;
  padding: 6px;
  z-index: var(--zindex-canvas-overlay);
  pointer-events: auto;
`;

const CanvasControlMenu: Component = () => {
  const resetAvailable = createMemo(() => interactStore.verticalFlipped || interactStore.horizontalFlipped || interactStore.rotation !== 0);

  return (
    <>
      <div
        class={iconContainer}
        title='vertical flip.'
        style={{
          cursor: 'pointer',
          transform: interactStore.verticalFlipped ? 'scaleY(-1)' : '',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          toggleVerticalFlip();
        }}
      >
        <Icon
          src='/icons/canvas/flip_vertical_9.png'
          base={9}
          scale={1}
          color={interactStore.verticalFlipped ? color.enabled : color.onBackground}
          // hoverColor={color.active}
        />
      </div>
      <div
        class={iconContainer}
        title='horizontal flip.'
        style={{
          cursor: 'pointer',
          transform: interactStore.horizontalFlipped ? 'scaleX(-1)' : '',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          toggleHorizontalFlip();
        }}
      >
        <Icon
          src='/icons/canvas/flip_horizontal_9.png'
          base={9}
          scale={1}
          color={interactStore.horizontalFlipped ? color.enabled : color.onBackground}
          // hoverColor={color.active}
        />
      </div>
      <div
        class={iconContainer}
        title='rotate clockwise.'
        style={{
          cursor: 'pointer',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const currentNearestRightAngle = Math.round(interactStore.rotation / 90);
          setRotation((currentNearestRightAngle + 1) * 90);
        }}
      >
        <Icon src='/icons/canvas/rotate_clockwise_9.png' base={9} scale={1} color={color.onBackground} hoverColor={color.active} />
      </div>
      <div
        class={iconContainer}
        title='rotate counter-clockwise.'
        style={{
          cursor: 'pointer',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const currentNearestRightAngle = Math.round(interactStore.rotation / 90);
          setRotation((currentNearestRightAngle - 1) * 90);
        }}
      >
        <Icon src='/icons/canvas/rotate_counterclockwise_9.png' base={9} scale={1} color={color.onBackground} hoverColor={color.active} />
      </div>
      <div
        class={iconContainer}
        title='reset orientation.'
        style={{
          cursor: resetAvailable() ? 'pointer' : 'auto',
          'pointer-events': resetAvailable() ? 'all' : 'none',
          opacity: resetAvailable() ? 1.0 : 0.5,
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          resetOrientation();
        }}
      >
        <Icon src='/icons/canvas/reset_orientation_9.png' base={9} scale={1} color={color.onBackground} hoverColor={color.active} />
      </div>
      <div
        class={iconContainer}
        title='toggle ruler.'
        style={{
          cursor: 'pointer',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          setAppearanceStore('ruler', (v) => !v);
        }}
      >
        <Icon
          src='/icons/canvas/ruler_9.png'
          base={9}
          scale={1}
          color={appearanceStore.ruler ? color.enabled : color.onBackground}
          // hoverColor={color.active}
        />
      </div>
      <div
        class={iconContainer}
        title='toggle onscreenControl.'
        style={{
          cursor: 'pointer',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          setAppearanceStore('onscreenControl', (v) => !v);
        }}
      >
        <Icon
          src='/icons/canvas/onscreen_control_9.png'
          base={9}
          scale={1}
          color={appearanceStore.onscreenControl ? color.enabled : color.onBackground}
          // hoverColor={color.active}
        />
      </div>
    </>
  );
};

export default CanvasControlMenu;
