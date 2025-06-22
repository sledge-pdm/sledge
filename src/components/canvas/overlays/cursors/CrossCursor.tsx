import { Component } from 'solid-js';
import { Vec2 } from '~/models/types/Vector';

interface Props {
  mousePos: Vec2;
}

const CrossCursor: Component<Props> = (props: Props) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: `${props.mousePos.y}px`,
        left: `${props.mousePos.x}px`,
        width: '11px',
        height: '11px',

        'transform-origin': '0 0',
        transform: 'translate(-50%, -50%)',

        'touch-action': 'none',
        'pointer-events': 'none',
      }}
    >
      <div
        style={{
          display: 'block',
          position: 'absolute',
          width: '11px',
          height: '1px',
          top: '50%',
          left: '50%',
          'transform-origin': '0 0',
          transform: 'translate(-50%, -50%)',
          'backdrop-filter': 'invert()',
        }}
      />

      <div
        style={{
          display: 'block',
          position: 'absolute',
          width: '1px',
          height: '11px',
          top: '50%',
          left: '50%',
          'transform-origin': '0 0',
          transform: 'translate(-50%, -50%)',
          'backdrop-filter': 'invert()',
        }}
      />
    </div>
  );
};

export default CrossCursor;
