import { flexCol } from '@sledge/core';
import { vars, ZFB03 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const swatchContainer = style([
  flexCol,
  {
    position: 'relative',
    gap: vars.spacing.xs,
    marginRight: vars.spacing.md,
  },
]);

export const descriptionContainer = style([
  flexCol,
  {
    justifyContent: 'end',
    marginBottom: vars.spacing.sm,
  },
]);

export const colorElemDescription = style({
  color: vars.color.muted,
  fontFamily: ZFB03,
  fontSize: vars.text.sm,
  transform: 'rotate(180deg)',
  whiteSpace: 'nowrap',
  writingMode: 'vertical-rl',
});

export const colorContent = style([
  flexCol,
  {
    marginLeft: vars.spacing.sm,
  },
]);
