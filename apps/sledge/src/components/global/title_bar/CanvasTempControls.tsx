import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component } from 'solid-js';
import { resetOrientation, setRotation, toggleHorizontalFlip, toggleVerticalFlip } from '~/features/canvas';
import { interactStore } from '~/stores/EditorStores';
import { canvasTempControlContainer } from '~/styles/components/canvas/canvas_controls.css';

const CanvasTempControls: Component = () => {
  return (
    <>
      <div
        class={canvasTempControlContainer}
        title='reset orientation.'
        style={{
          cursor: 'pointer',
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          resetOrientation();
        }}
      >
        <Icon src='/icons/misc/reset_orientation_9.png' base={9} scale={1} color={vars.color.onBackground} hoverColor={vars.color.active} />
      </div>
      <div
        class={canvasTempControlContainer}
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
          src='/icons/misc/flip_vertical_9.png'
          base={9}
          scale={1}
          color={interactStore.verticalFlipped ? vars.color.enabled : vars.color.onBackground}
          // hoverColor={vars.color.active}
        />
      </div>
      <div
        class={canvasTempControlContainer}
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
          src='/icons/misc/flip_horizontal_9.png'
          base={9}
          scale={1}
          color={interactStore.horizontalFlipped ? vars.color.enabled : vars.color.onBackground}
          // hoverColor={vars.color.active}
        />
      </div>
      <div
        class={canvasTempControlContainer}
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
        <Icon src='/icons/misc/rotate_clockwise_9.png' base={9} scale={1} color={vars.color.onBackground} hoverColor={vars.color.active} />
      </div>
      <div
        class={canvasTempControlContainer}
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
        <Icon src='/icons/misc/rotate_counterclockwise_9.png' base={9} scale={1} color={vars.color.onBackground} hoverColor={vars.color.active} />
      </div>
    </>
  );
};

export default CanvasTempControls;
