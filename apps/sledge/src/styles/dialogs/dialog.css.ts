// src/components/common/Dialog.css.ts
import { flexRow, w100 } from '@sledge/core';
import { vars, ZFB31 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const overlay = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: vars.color.overlay,
  zIndex: 1000,
});

export const wrapper = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  margin: 'auto',
  width: 'fit-content',
  height: 'fit-content',
  maxWidth: '90vw',
  background: vars.color.background,
  borderRadius: vars.size.dialogRadius,
  // boxShadow: '0 0px 30px #FFFFFF50',
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
  overflowY: 'hidden',
});

export const footer = style([
  flexRow,
  {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: vars.spacing.md,
    marginBottom: vars.spacing.xl,
    marginLeft: vars.spacing.xl,
    marginRight: vars.spacing.xl,
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
