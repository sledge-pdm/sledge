import { css } from '@acab/ecsstatic';
import { Icon } from '@sledge/ui';
import { Component, JSX, Show } from 'solid-js';

const container = css`
  display: flex;
  flex-direction: row;
  align-items: end;
  overflow: visible;
  gap: 16px;
`;

export const iconContainer = css`
  margin-bottom: 6px;
`;

export const header = css`
  font-size: 32px;
  font-family: ZFB09;
  user-select: text;
  vertical-align: bottom;
`;

interface Props {
  iconSrc?: string;
  children?: JSX.Element | JSX.Element[];
}

const WikiContentHeader: Component<Props> = (props) => {
  return (
    <div class={container}>
      <Show when={props.iconSrc}>
        <div class={iconContainer}>
          <Icon src={props.iconSrc!} base={8} scale={4} />
        </div>
      </Show>
      <p class={header}>{props.children}</p>
    </div>
  );
};

export default WikiContentHeader;
