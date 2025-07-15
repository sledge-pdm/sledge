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
});

export const canvasSizeInput = style({
  fontSize: vars.text.xl,
  width: '50px',
});
export const canvasSizeButton = style({
  margin: `${vars.spacing.xs} 0`,
});

export const canvasSizeResetAllLayerButton = style({
  borderColor: vars.color.error,
  color: vars.color.error,

  marginTop: vars.spacing.lg,
});
