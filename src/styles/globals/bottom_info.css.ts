import { flexRow, h100 } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const bottomInfoRoot = style([
  flexRow,
  {
    position: 'fixed',
    backgroundColor: vars.color.background,
    borderTop: `1px solid ${vars.color.border}`,
    height: '20px',
    margin: 0,
    bottom: 0,
  },
]);

export const bottomInfoContainer = style([
  flexRow,
  h100,
  {
    height: '20px',
    width: '100%',
    alignItems: 'center',
    paddingLeft: vars.spacing.md,
    gap: vars.spacing.md,
  },
]);

export const bottomInfoContainerRight = style([
  flexRow,
  h100,
  {
    height: '20px',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'end',
    gap: vars.spacing.md,
    paddingRight: vars.spacing.xs,
  },
]);

export const bottomInfoText = style({});
