import { css } from '@acab/ecsstatic';
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
  opacity: 0.8;
  cursor: pointer;
`;

interface Props {
  iconSrc: string;
  title?: string;
  onClick?: () => void;
}

const LayerListIconButton: Component<Props> = (props) => {
  return (
    <div
      class={iconContainer}
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
