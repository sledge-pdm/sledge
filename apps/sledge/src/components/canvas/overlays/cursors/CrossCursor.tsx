import { css } from '@acab/ecsstatic';
import { Vec2 } from '@sledge/core';
import { Component } from 'solid-js';

const root = css`
  position: fixed;
  width: 11px;
  height: 11px;
  transform-origin: 0 0;
  transform: translate(-50%, -50%);
  touch-action: none;
  pointer-events: none;
`;

const horizontalBar = css`
  display: block;
  position: absolute;
  width: 11px;
  height: 1px;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  transform: translate(-50%, -50%);
  backdrop-filter: invert();
`;

const verticalBar = css`
  display: block;
  position: absolute;
  width: 1px;
  height: 11px;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  transform: translate(-50%, -50%);
  backdrop-filter: invert();
`;

interface Props {
  mousePos: Vec2;
}

const CrossCursor: Component<Props> = (props: Props) => {
  return (
    <div
      class={root}
      style={{
        top: `${props.mousePos.y}px`,
        left: `${props.mousePos.x}px`,
      }}
    >
      <div class={horizontalBar} />

      <div class={verticalBar} />
    </div>
  );
};

export default CrossCursor;
