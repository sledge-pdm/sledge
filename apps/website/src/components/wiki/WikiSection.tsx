import { css } from '@acab/ecsstatic';
import { Component, JSX } from 'solid-js';

const section = css`
  display: flex;
  flex-direction: column;
`;
const sectionLabel = css`
  font-size: 8px;
  font-family: ZFB20;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-top: 16px;
  margin-bottom: 16px;
`;

interface Props {
  title: string;
  children?: JSX.Element | JSX.Element[];
}

const WikiSection: Component<Props> = (props) => {
  return (
    <div class={section}>
      <p class={sectionLabel}>{props.title}</p>
      {props.children}
    </div>
  );
};

export default WikiSection;
