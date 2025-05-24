// src/components/common/Dialog.css.ts
import { style } from '@vanilla-extract/css';
import { ZFB31 } from '~/styles/global.css';
import { vars } from '../global.css';
import { flexRow, w100 } from '../snippets.css';

export const overlay = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 1000,
});

export const wrapper = style({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth: '90vw',
  background: vars.color.background,
  borderRadius: vars.size.dialogRadius,
  boxShadow: '0 2px 24px #FFFFFF20',
  zIndex: 1001,
  overflow: 'visible',
});

export const header = style({
  fontFamily: ZFB31,
  fontSize: vars.text.lg,
  color: vars.color.accent,
  paddingTop: vars.spacing.xl,
  paddingLeft: vars.spacing.xl,
  paddingRight: vars.spacing.xl,
  paddingBottom: vars.spacing.xl,
});

export const body = style({
  maxHeight: '70vh',
  overflowY: 'auto',
  marginTop: vars.spacing.sm,
  marginBottom: vars.spacing.xl,
  marginLeft: vars.spacing.xl,
  marginRight: vars.spacing.xl,
  overflow: 'visible',
});

export const footer = style([
  flexRow,
  {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: vars.spacing.md,
    overflow: 'visible',
  },
]);

export const footerLeft = style([
  flexRow,
  w100,
  {
    justifyContent: 'flex-start',
    gap: vars.spacing.sm,
  },
]);

export const footerRight = style([
  flexRow,
  w100,
  {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: vars.spacing.sm,
  },
]);
