import { css } from '@acab/ecsstatic';
import { color, Icon } from '@sledge-pdm/ui';
import { Component, createMemo } from 'solid-js';
import { isBusy } from '~/features/busy';
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

  const rotateBy = (steps: number) => {
    const currentNearestRightAngle = Math.round(interactStore.rotation / 90);
    setRotation((currentNearestRightAngle + steps) * 90);
  };

  return (
    <>
      <CanvasControlMenuItem
        tooltipTitle='vertical flip.'
        icon9px='/assets/icons/canvas/flip_vertical_9.png'
        onClick={() => toggleVerticalFlip()}
        enabled={interactStore.verticalFlipped}
        transform={interactStore.verticalFlipped ? 'scaleY(-1)' : undefined}
        disabled={isBusy()}
      />
      <CanvasControlMenuItem
        tooltipTitle='horizontal flip.'
        icon9px='/assets/icons/canvas/flip_horizontal_9.png'
        onClick={() => toggleHorizontalFlip()}
        enabled={interactStore.horizontalFlipped}
        transform={interactStore.horizontalFlipped ? 'scaleX(-1)' : undefined}
        disabled={isBusy()}
      />
      <CanvasControlMenuItem
        tooltipTitle='rotate clockwise.'
        icon9px='/assets/icons/canvas/rotate_clockwise_9.png'
        onClick={() => rotateBy(1)}
        disabled={isBusy()}
      />
      <CanvasControlMenuItem
        tooltipTitle='rotate counter-clockwise.'
        icon9px='/assets/icons/canvas/rotate_counterclockwise_9.png'
        onClick={() => rotateBy(-1)}
        disabled={isBusy()}
      />
      <CanvasControlMenuItem
        tooltipTitle='reset orientation.'
        icon9px='/assets/icons/canvas/reset_orientation_9.png'
        onClick={() => resetOrientation()}
        disabled={!resetAvailable() || isBusy()}
      />
      <CanvasControlMenuItem
        tooltipTitle='toggle ruler.'
        icon9px='/assets/icons/canvas/ruler_9.png'
        onClick={() => setAppearanceStore('ruler', (v) => !v)}
        enabled={appearanceStore.ruler}
        disabled={isBusy()}
      />
      <CanvasControlMenuItem
        tooltipTitle='toggle onscreenControl.'
        icon9px='/assets/icons/canvas/onscreen_control_9.png'
        onClick={() => setAppearanceStore('onscreenControl', (v) => !v)}
        enabled={appearanceStore.onscreenControl}
        disabled={isBusy()}
      />
    </>
  );
};

interface CanvasControlMenuItemProps {
  tooltipTitle: string;
  icon9px: string;
  onClick?: () => void;
  /** トグル状態を持つ項目のみ指定する。指定した場合、hover 色ではなく enabled 色で状態を示す。 */
  enabled?: boolean;
  disabled?: boolean;
  transform?: string;
}

const CanvasControlMenuItem: Component<CanvasControlMenuItemProps> = (props) => {
  const isToggle = () => props.enabled !== undefined;

  return (
    <div
      class={iconContainer}
      title={props.tooltipTitle}
      style={{
        cursor: props.disabled ? 'auto' : 'pointer',
        'pointer-events': props.disabled ? 'none' : undefined,
        opacity: props.disabled ? 0.5 : 1.0,
        transform: props.transform,
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        props.onClick?.();
      }}
    >
      <Icon
        src={props.icon9px}
        base={9}
        scale={1}
        color={props.enabled ? color.enabled : color.onBackground}
        hoverColor={isToggle() ? undefined : color.active}
      />
    </div>
  );
};

export default CanvasControlMenu;
