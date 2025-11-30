import { css } from '@acab/ecsstatic';
import { Component } from 'solid-js';
import { Portal } from 'solid-js/web';

const borderBg = css`
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 0;
  left: 0;
  height: 100dvh;
  width: 100dvw;
  z-index: -1;
  opacity: 0.15;
  background: url(/icons/misc/tex_45border_16.png) left top;
  background-repeat: repeat;
  background-size: 16px 16px;
`;

const NormalPortal: Component = () => {
  return (
    <Portal mount={document.querySelector('#portal-root') as Node}>
      <div class={borderBg} />
    </Portal>
  );
};

export default NormalPortal;
