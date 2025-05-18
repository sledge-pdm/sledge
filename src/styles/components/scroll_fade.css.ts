import { style } from '@vanilla-extract/css';

const fadeBase = style({
  pointerEvents: 'none',
  position: 'absolute',
  left: 0,
  width: '100%',
  height: '36px',
});

export const fadeTop = style([
  fadeBase,
  {
    top: 0,
    background: 'linear-gradient(to bottom, rgb(255, 255, 255), transparent)',
  },
]);

export const fadeBottom = style([
  fadeBase,
  {
    bottom: 0,
    background: 'linear-gradient(to top, rgb(255, 255, 255), transparent)',
  },
]);
