import { css } from '@acab/ecsstatic';
import { Component } from 'solid-js';
import { pageRoot } from '~/styles';

const loadingText = css`
  font-family: ZFB31;
  text-transform: uppercase;
  font-size: 12px;
`;

const Loading: Component = (props) => {
  return (
    <div class={pageRoot} style={{ 'align-items': 'center', 'justify-content': 'center' }}>
      <p class={loadingText}>loading.</p>
    </div>
  );
};

export default Loading;
