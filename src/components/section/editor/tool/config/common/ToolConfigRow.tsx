import { css } from '@acab/ecsstatic';
import { Component, JSXElement, Show } from 'solid-js';

const root = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  min-height: 24px;
  align-items: center;
`;

const labelContainer = css`
  display: flex;
  flex-direction: row;
  min-width: 72px;
`;

const content = css`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  justify-content: end;
`;

const label = css`
  font-family: ZFB09;
  vertical-align: middle;
  margin-bottom: -1px;
  text-align: left;
  margin-right: 8px;
`;

interface Props {
  label?: string;
  children?: JSXElement;
}

const ToolConfigRow: Component<Props> = (props) => {
  return (
    <div class={root}>
      <Show when={props.label}>
        <div class={labelContainer}>
          <label class={label}>{props.label}</label>
        </div>
      </Show>
      <div class={content}>{props.children}</div>
    </div>
  );
};

export default ToolConfigRow;
