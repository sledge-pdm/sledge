import { style } from '@vanilla-extract/css';
import { vars } from '~/styles/global.css';

const fadeBase = style({
  pointerEvents: 'none',
  position: 'absolute',
  left: 0,
  width: '100%',
  height: '48px',
});

export const fadeTop = style([
  fadeBase,
  {
    top: 0,
    background: `linear-gradient(to bottom, ${vars.color.background}, transparent)`,
  },
]);

export const fadeBottom = style([
  fadeBase,
  {
    bottom: 0,
    transform: 'translateY(-100%)',
    background: `linear-gradient(to top, ${vars.color.background}, transparent)`,
  },
]);
