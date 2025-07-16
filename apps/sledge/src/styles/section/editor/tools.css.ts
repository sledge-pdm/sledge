import { flexRow, w100 } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const toolConfigRow = style([
  flexRow,
  w100,
  {
    height: '32px',
    width: 'auto',
    gap: vars.spacing.md,
    alignItems: 'center',
  },
]);
export const toolConfigRowClickable = style([
  flexRow,
  {
    gap: vars.spacing.md,
    alignItems: 'center',
    pointerEvents: 'all',
    cursor: 'pointer',
  },
]);

export const toolConfigRowName = style({
  cursor: 'pointer',
  width: '50px',
  fontSize: vars.text.sm,
  padding: `${vars.spacing.md} 0`,
});

export const toolConfigRowIcon = style({
  ':hover': {
    filter: 'invert(11%) sepia(92%) saturate(7351%) hue-rotate(0deg) brightness(99%) contrast(109%);', // 赤っぽく
  },
});
