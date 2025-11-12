import { css } from '@acab/ecsstatic';
import { Vec2 } from '@sledge/core';
import { Component } from 'solid-js';

const root = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 3px;
  height: 3px;
  margin-top: -1.5px;
  margin-left: -1.5px;
  backdrop-filter: invert();
  touch-action: none;
  pointer-events: none;
`;

interface Props {
  mousePos: Vec2;
}

const PixelCursor: Component<Props> = (props: Props) => {
  return (
    <div
      class={root}
      style={{
        translate: `${props.mousePos.x}px ${props.mousePos.y}px`,
      }}
    />
  );
};

export default PixelCursor;
