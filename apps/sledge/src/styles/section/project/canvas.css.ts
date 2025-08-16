import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const canvasSizeForm = style([
  flexRow,
  {
    alignItems: 'flex-end',
    marginBottom: '6px',
    gap: vars.spacing.sm,
  },
]);

export const canvasSizeTimes = style({
  fontSize: vars.text.xl,
  marginBottom: vars.spacing.xs,
});

export const canvasSizeLabel = style({
  fontSize: vars.text.sm,
  color: vars.color.muted,
});

export const canvasSizeInput = style({
  fontSize: vars.text.xl,
  width: '50px',
});
export const canvasSizeButton = style({
  margin: `${vars.spacing.xs} 0`,
});
