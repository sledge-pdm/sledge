import { css } from '@acab/ecsstatic';
import { Vec2 } from '@sledge/core';
import { Component } from 'solid-js';

const root = css`
  position: fixed;
  top: 0;
  left: 0;
  margin-top: -8.5px;
  margin-left: -8.5px;
  width: 17px;
  height: 17px;
  touch-action: none;
  pointer-events: none;
`;

const horizontalBar = css`
  display: block;
  position: absolute;
  width: 17px;
  height: 1px;
  top: 8.5px;
  left: 0.5px;
  backdrop-filter: invert();
`;

const verticalBar = css`
  display: block;
  position: absolute;
  width: 1px;
  height: 17px;
  top: 0.5px;
  left: 8.5px;
  backdrop-filter: invert();
`;

interface Props {
  mousePos: Vec2;
}

const PipetteCursor: Component<Props> = (props: Props) => {
  return (
    <div
      class={root}
      style={{
        translate: `${props.mousePos.x}px ${props.mousePos.y}px`,
      }}
    >
      <div class={horizontalBar} />
      <div class={verticalBar} />
    </div>
  );
};

export default PipetteCursor;
