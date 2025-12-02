import { css } from '@acab/ecsstatic';
import { Component } from 'solid-js';

const borderBg = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  opacity: 0.2;
  background: url(/icons/misc/tex_45border_16_gr.png) left top;
  background-repeat: repeat;
  background-size: 16px 16px;
`;

const BorderBackground: Component = () => {
  return <div class={borderBg} />;
};

export default BorderBackground;
