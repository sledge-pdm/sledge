import { css } from '@acab/ecsstatic';
import { Component, JSXElement } from 'solid-js';

const root = css`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
const label = css`
  font-family: ZFB03;
  font-size: var(--text-sm);
  opacity: 0.8;
`;

interface EffectControlProps {
  label: string;
  children?: JSXElement;
}

export const EffectControl: Component<EffectControlProps> = (props) => {
  return (
    <div class={root}>
      <p class={label}>{props.label}</p>
      {props.children}
    </div>
  );
};
