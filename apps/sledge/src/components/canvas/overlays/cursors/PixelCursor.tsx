import { css } from '@acab/ecsstatic';
import { Vec2 } from '@sledge/core';
import { Component } from 'solid-js';

const root = css`
  position: fixed;
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
        top: `${props.mousePos.y}px`,
        left: `${props.mousePos.x}px`,
      }}
    />
  );
};

export default PixelCursor;
