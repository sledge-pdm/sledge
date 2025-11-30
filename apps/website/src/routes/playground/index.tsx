import { css } from '@acab/ecsstatic';
import { RouteSectionProps } from '@solidjs/router';
import { Component } from 'solid-js';

const listLink = css`
  font-size: 16px;
  font-family: ZFB21;
  text-transform: uppercase;
`;

const PlaygroundIndex: Component<RouteSectionProps> = (props) => {
  return (
    <div>
      <a class={listLink} href='/playground/pointer-test'>
        1. Pointer Test
      </a>
    </div>
  );
};

export default PlaygroundIndex;
