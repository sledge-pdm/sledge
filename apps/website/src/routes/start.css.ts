import { flexCol, flexRow, w100 } from '@sledge/core';
import { vars, ZFB08, ZFB31 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const startRoot = style([
  flexCol,
  w100,
  {
    overflow: 'hidden',
    padding: '48px 42px',
    boxSizing: 'border-box',
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
  flexRow,
  {
    flexWrap: 'wrap',
    width: '100%',
    padding: '5rem 5rem',
    boxSizing: 'border-box',
    '@media': {
      '(max-width: 1600px)': {
        gap: '5rem',
      },
      '(max-width: 768px)': {
        padding: `3rem 1rem`,
      },
    },
  },
]);

export const description = style([
  flexCol,
  {
    width: '50%',
    padding: '3rem 0',
    gap: '3rem',
    '@media': {
      '(max-width: 1600px)': {
        width: '100%',
        padding: 0,
      },
    },
  },
]);

export const startImage = style({
  width: '50%',
  filter: 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.5))',
  '@media': {
    '(max-width: 1600px)': {
      width: '100%',
      height: 'auto',
    },
  },
});

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
      fontSize: '18px',
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
  '@media': {
    '(max-width: 768px)': {
      borderWidth: '2px',
      padding: '12px 24px',
    },
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
