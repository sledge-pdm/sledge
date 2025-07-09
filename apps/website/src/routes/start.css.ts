import { flexCol, wh100 } from '@sledge/core';
import { vars, ZFB08, ZFB31 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const startRoot = style([
  flexCol,
  wh100,
  {
    overflow: 'hidden',
    padding: '48px 42px',
    userSelect: 'text',
    '@media': {
      '(max-width: 768px)': {
        padding: `${vars.spacing.xl} ${vars.spacing.lg}`,
      },
    },
  },
]);
export const startIcon = style({
  width: '56px',
  height: '56px',
  '@media': {
    '(max-width: 768px)': {
      width: '42px',
      height: '42px',
    },
  },
});

export const startHeader = style({
  fontFamily: ZFB31,
  fontSize: '24px',
  letterSpacing: '2px',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '12px',
    },
  },
});

export const content = style([
  flexCol,
  {
    margin: '6rem 5rem',
    gap: '2rem',
    '@media': {
      '(max-width: 768px)': {
        margin: `3rem ${vars.spacing.lg}`,
      },
    },
  },
]);

export const greetText = style({
  fontFamily: ZFB31,
  fontSize: '58px',
  letterSpacing: '2px',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '36px',
    },
  },
});

export const startText = style({
  fontFamily: ZFB08,
  fontSize: '24px',
  letterSpacing: '2px',
  lineHeight: '1.5',
  marginBottom: '2rem',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '16px',
    },
  },
});

export const mainButton = style({
  fontSize: '16px',
  padding: '16px 28px',
  borderWidth: '2px',
  ':hover': {
    backgroundColor: vars.color.accent,
    borderColor: vars.color.accent,
    color: vars.color.background,
  },
});

export const themeArea = style([
  flexCol,
  {
    position: 'fixed',
    top: vars.spacing.xl,
    right: vars.spacing.xl,
    gap: vars.spacing.md,
    alignItems: 'end',
    margin: '1rem',
    '@media': {
      '(max-width: 768px)': {
        top: 'initial',
        bottom: vars.spacing.xl,
        left: vars.spacing.xl,
        alignItems: 'start',
        margin: 0,
      },
    },
  },
]);

export const rightBottomArea = style([
  flexCol,
  {
    position: 'fixed',
    bottom: vars.spacing.xl,
    right: vars.spacing.xl,
    gap: vars.spacing.md,
    alignItems: 'end',
  },
]);
