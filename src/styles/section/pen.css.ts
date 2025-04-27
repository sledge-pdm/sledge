import { style } from '@vanilla-extract/css';
import { vars } from '../global.css';
import { flexRow, w100 } from '../snippets.css';

export const penConfigRow = style([
  flexRow,
  w100,
  {
    gap: vars.spacing.md,
    alignItems: 'center',
  },
]);
export const penConfigRowClickable = style([
  flexRow,
  {
    gap: vars.spacing.md,
    alignItems: 'center',
    width: '35%',
  },
]);

export const penConfigRowName = style({
  cursor: 'pointer',
  fontSize: vars.text.sm,
  padding: `${vars.spacing.md} 0`,
  pointerEvents: 'all',
});

export const penConfigRowIcon = style({
  ':hover': {
    filter:
      'invert(11%) sepia(92%) saturate(7351%) hue-rotate(0deg) brightness(99%) contrast(109%);', // 赤っぽく
  },
});
