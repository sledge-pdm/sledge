import { style } from '@vanilla-extract/css';
import { ZFB09, ZFB31 } from '~/styles/global.css';
import { flexCol, flexRow } from '~/styles/snippets.css';
import { vars } from '../global.css';

export const root = style([
  flexCol,
  {
    position: 'relative',
    height: '100%',
    width: '400px',
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
  {
    gap: vars.spacing.xl,
  },
]);

export const field = style([
  flexCol,
  {
    maxWidth: '400px',
  },
]);

export const fieldDisabled = style([
  field,
  {
    pointerEvents: 'none',
    cursor: 'auto',
    opacity: 0.4,
  },
]);

export const fieldHeader = style([
  {
    fontFamily: ZFB09,
    fontSize: vars.text.sm,
    marginBottom: vars.spacing.sm,
    color: vars.color.onBackground,
    verticalAlign: 'middle',
    // textDecoration: 'underline',
    ':before': {
      content: '■',
      fontSize: vars.text.xs,
      display: 'inline-block',
      textDecoration: 'none',
      marginRight: '6px',
      // filter: 'brightness(80%)',
      color: vars.color.accent,
    },
  },
]);

export const fileName = style([
  flexCol,
  {
    fontSize: '16px',
    width: 'fit-content',
    border: 'none',
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
    bottom: '24px',
    right: '42px',
    gap: '4px',
  },
]);
