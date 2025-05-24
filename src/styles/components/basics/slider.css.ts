// src/styles/components/basics/slider.css.ts
import { style } from '@vanilla-extract/css';
import { vars } from '~/styles/global.css';
import { flexCol, flexRow } from '~/styles/snippets.css';

export const sliderRoot = style([
  flexRow,
  {
    position: 'relative',
    width: '100%',
    height: 'auto',
  },
]);

export const valueLabelContainer = style([
  flexCol,
  {
    minWidth: '64px',
    height: '12px',
  },
]);
export const valueLabelInput = style({
  width: '52px',
  letterSpacing: '1px',
});

export const slider = style({
  alignItems: 'center',
  display: 'flex',
  height: 'auto',
  overflow: 'visible',
  position: 'relative',
  width: '100%',
  touchAction: 'none',
});

export const lineHitbox = style({
  alignItems: 'center',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  height: '16px',
  position: 'absolute',
  width: '100%',
});

export const line = style({
  backgroundColor: vars.color.control,
  display: 'flex',
  height: '1px',
  pointerEvents: 'none', // イベントは親に任せる
  width: '100%',
});

export const handle = style({
  backgroundColor: vars.color.control,
  height: '8px',
  left: '50%',
  pointerEvents: 'none',
  position: 'absolute',
  transform: 'translateX(-50%)',
  width: '2px',
});
