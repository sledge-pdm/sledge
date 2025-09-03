import { flexCol, w100 } from '@sledge/core';
import { k12x8, vars, ZFB20 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const pageRoot = style([
  flexCol,
  {
    width: '380px',
    height: 'auto',
    padding: '0 4rem 5rem 3rem',

    '@media': {
      '(max-width: 599px)': {
        boxSizing: 'border-box',
        width: '100%',
        padding: '0 2rem 0 2rem',
      },
    },
  },
]);

export const heroHeading = style({
  fontFamily: ZFB20,
  fontSize: '16px',
  letterSpacing: '1px',
  marginBottom: '16px',
  verticalAlign: 'baseline',
  inset: 0,
  color: vars.color.onBackground,
  '@media': {
    '(max-width: 599px)': {
      fontSize: '16px',
    },
  },
});

export const subHeading = style({
  fontFamily: k12x8,
  fontSize: '8px',
  letterSpacing: '1px',
  width: '100%',
  lineHeight: 1.6,
  marginBottom: '12px',
  color: vars.color.onBackground,
  '@media': {
    '(max-width: 599px)': {
      fontSize: '8px',
    },
  },
});

export const scrollContent = style([
  flexCol,
  w100,
  {
    boxSizing: 'border-box',
    height: 'auto',
  },
]);

export const themeArea = style([
  flexCol,
  {
    position: 'absolute',
    top: vars.spacing.xl,
    right: vars.spacing.xl,
    gap: vars.spacing.md,
    alignItems: 'end',
    margin: '1rem',
    '@media': {
      '(max-width: 599px)': {
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
    position: 'absolute',
    bottom: vars.spacing.xl,
    right: vars.spacing.xl,
    gap: vars.spacing.md,
    marginRight: '1rem',
    alignItems: 'end',
    '@media': {
      '(max-width: 599px)': {
        marginRight: 0,
      },
    },
  },
]);
