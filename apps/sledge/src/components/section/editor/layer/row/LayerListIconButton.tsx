import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { color } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component } from 'solid-js';

const iconContainer = css`
  display: flex;
  flex-direction: column;
  align-content: center;
  align-items: center;
  pointer-events: auto;
  padding: 2px;
  opacity: 1;
  cursor: pointer;
`;

const iconContainerDisabled = css`
  cursor: default;
  pointer-events: none;
  opacity: 0.5;
`;

interface Props {
  iconSrc: string;
  title?: string;
  disabled?: boolean;
  onClick?: () => void;
}

const LayerListIconButton: Component<Props> = (props) => {
  return (
    <div
      class={clsx(iconContainer, props.disabled && iconContainerDisabled)}
      title={props.title}
      onClick={(e) => {
        props.onClick?.();
      }}
    >
      <Icon src={props.iconSrc} base={9} scale={1} hoverColor={color.active} />
    </div>
  );
};
export default LayerListIconButton;
