// src/styles/components/basics/slider.css.ts
import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const sliderRoot = style([
  flexRow,
  {
    position: 'relative',
    width: '100%',
    height: 'auto',
  },
]);

export const valueLabelContainer = style([
  flexRow,
  {
    minWidth: '52px',
  },
]);
export const valueLabel = style({
  width: '52px',
});
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
  backgroundColor: vars.color.onBackground,
  display: 'flex',
  height: '1px',
  pointerEvents: 'none', // イベントは親に任せる
  width: '100%',
});

export const handle = style({
  backgroundColor: vars.color.onBackground,
  height: '8px',
  left: '50%',
  pointerEvents: 'none',
  position: 'absolute',
  transform: 'translateX(-50%)',
  width: '2px',
});
