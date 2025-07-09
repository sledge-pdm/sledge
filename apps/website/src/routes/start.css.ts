import { flexCol, flexRow, w100 } from '@sledge/core';
import { vars, ZFB08, ZFB31 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const startRoot = style([
  flexCol,
  w100,
  {
    overflow: 'hidden',
    padding: '42px 42px',
    boxSizing: 'border-box',
    userSelect: 'text',
    '@media': {
      '(max-width: 768px)': {
        padding: `${vars.spacing.xl} ${vars.spacing.lg}`,
      },
    },
  },
]);

export const header = style([
  flexRow,
  {
    gap: '1rem',
    alignItems: 'center',
    textDecoration: 'none',
  },
]);

export const startIcon = style({
  width: '56px',
  height: '56px',
  '@media': {
    '(max-width: 768px)': {
      width: '36px',
      height: '36px',
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
    padding: '5rem 3rem',
    boxSizing: 'border-box',
    '@media': {
      '(max-width: 1600px)': {
        gap: '4rem',
      },
      '(max-width: 768px)': {
        padding: `4rem 1rem`,
      },
    },
  },
]);

export const description = style([
  flexCol,
  {
    width: '45%',
    padding: '3rem 2rem',
    boxSizing: 'border-box',
    gap: '3rem',
    '@media': {
      '(max-width: 1600px)': {
        width: '100%',
        padding: 0,
        gap: '2rem',
      },
    },
  },
]);

export const startImage = style({
  width: '55%',
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
      fontSize: '12px',
      marginBottom: '1rem',
    },
  },
});

export const mainButtonContainer = style([
  flexRow,
  {
    gap: '2rem',
    flexWrap: 'wrap',
    '@media': {
      '(max-width: 768px)': {
        gap: '1rem',
      },
    },
  },
]);

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
    marginRight: '1rem',
    alignItems: 'end',
    '@media': {
      '(max-width: 768px)': {
        marginRight: 0,
      },
    },
  },
]);
