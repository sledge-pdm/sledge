import { flexCol, flexRow } from '@sledge/core';
import { vars, ZFB03 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const swatchHeader = style([
  flexRow,
  {
    alignItems: 'center',
    marginBottom: '8px',
  },
]);

export const swatchDropdownContainer = style([flexRow, {}]);

export const swatchContainer = style([
  flexRow,
  {
    position: 'relative',
    gap: vars.spacing.xs,
    marginLeft: '8px',
    marginBottom: vars.spacing.lg,
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
  fontFamily: ZFB03,
  opacity: 0.25,
  fontSize: '8px',
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
