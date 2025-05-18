import { style } from '@vanilla-extract/css';
import { vars, ZFB09, ZFB31 } from '~/styles/global.css';
import { flexCol, flexRow, w100 } from '~/styles/snippets.css';

export const root = style([
  flexRow,
  {
    position: 'relative',
    padding: '16px 34px',
  },
]);

export const header = style([
  {
    fontFamily: ZFB31,
    fontSize: vars.text.lg,
    color: vars.color.accent,
    marginBottom: vars.spacing.md,
  },
]);

export const content = style([
  flexCol,
  w100,
  {
    flexGrow: 1,
    gap: vars.spacing.lg,
  },
]);

export const field = style([
  flexCol,
  {
    maxWidth: '300px',
  },
]);

export const fieldDisabled = style([
  field,
  {
    pointerEvents: 'none',
    cursor: 'auto',
    opacity: 0.15,
  },
]);

export const fieldHeader = style([
  {
    fontFamily: ZFB09,
    fontSize: vars.text.sm,
    marginBottom: vars.spacing.sm,
    textDecoration: 'underline',
  },
]);

export const customScaleInput = style([
  {
    fontFamily: ZFB09,
    fontSize: vars.text.md,
    width: '24px',
  },
]);

export const controlArea = style([
  flexRow,
  {
    position: 'absolute',
    justifyContent: 'center',
    top: '12px',
    right: '42px',
    gap: '4px',
  },
]);
