import { css } from '@acab/ecsstatic';
import { Component, JSXElement, Show } from 'solid-js';
import { flexRow } from '~/styles/styles';

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
    <div class={flexRow} style={{ width: '100%', 'min-height': '24px', 'align-items': 'center' }}>
      <Show when={props.label}>
        <div class={flexRow} style={{ 'min-width': '72px' }}>
          <label class={label}>{props.label}</label>
        </div>
      </Show>
      <div class={flexRow} style={{ 'flex-grow': 1, 'justify-content': 'end' }}>
        {props.children}
      </div>
    </div>
  );
};

export default ToolConfigRow;
