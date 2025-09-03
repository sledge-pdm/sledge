import { flexCol, w100 } from '@sledge/core';
import { k12x8, vars, ZFB20 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const pageRoot = style([
  flexCol,
  {
    width: '380px',
    padding: '0 4rem 3rem 3rem',

    '@media': {
      '(max-width: 599px)': {
        boxSizing: 'border-box',
        width: '100%',
        padding: '0 2rem 3rem 2rem',
      },
    },
  },
]);

export const heroHeading = style({
  fontFamily: `${ZFB20}, ${k12x8}`,
  fontSize: '16px',
  lineHeight: 1.25,
  letterSpacing: '1px',
  marginBottom: '16px',
  verticalAlign: 'baseline',
  inset: 0,
  color: vars.color.onBackground,
  opacity: 0.95, // slightly weaken
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
  marginBottom: '16px',
  color: vars.color.onBackground,
  opacity: 0.95, // slightly weaken
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

export const pageImage = style({
  width: '100%',
  height: 'auto',
  objectFit: 'cover',
  objectPosition: '0 0',
  border: `1px solid ${vars.color.muted}`,
  borderRadius: '8px',
  imageRendering: 'auto',
});

export const themeArea = style([
  flexCol,
  {
    position: 'absolute',
    top: vars.spacing.xl,
    right: vars.spacing.xl,
    gap: vars.spacing.md,
    alignItems: 'end',
    margin: '1rem',
    zIndex: 10,
    '@media': {
      '(max-width: 599px)': {
        top: 'unset',
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
    zIndex: 10,
    '@media': {
      '(max-width: 599px)': {
        marginRight: 0,
      },
    },
  },
]);
