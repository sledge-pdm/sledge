import { Component } from 'solid-js';
import { Vec2 } from '~/models/types/Vector';

interface Props {
  mousePos: Vec2;
}

const PixelCursor: Component<Props> = (props: Props) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: `${props.mousePos.y}px`,
        left: `${props.mousePos.x}px`,
        width: '2px',
        height: '2px',
        'transform-origin': '0 0',
        transform: 'translate(-50%, -50%)',
        'backdrop-filter': 'invert()',
        'touch-action': 'none',
        'pointer-events': 'none',
      }}
      pointer-events='none'
    />
  );
};

export default PixelCursor;
