import { flexCol, flexRow } from '@sledge/core';
import { vars, ZFB08, ZFB20 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const panel = style([
  flexRow,
  {
    scrollSnapAlign: 'start',
    scrollSnapStop: 'always',
    minHeight: '100dvh',
    height: '100%',
    position: 'relative',
    boxSizing: 'border-box',
    alignItems: 'stretch',
  },
]);

export const panelInner = style([
  flexRow,
  {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    justifyContent: 'space-between',
    alignItems: 'center',
    '@media': {
      '(max-width: 768px)': {
        flexWrap: 'wrap',
        padding: `3rem 1rem`,
        gap: '1.5rem',
      },
    },
  },
]);

export const leftCol = style([
  flexCol,
  {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '40%',
    height: '100dvh',
    backgroundColor: vars.color.background,
    '@media': {
      '(max-width: 768px)': {
        width: '100%',
      },
    },
  },
]);

export const buttonArea = style([
  flexRow,
  {
    marginTop: 'auto',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '1rem',
  },
]);

export const rightCol = style([
  flexCol,
  {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '60%',
    height: '100dvh',
    pointerEvents: 'none',
    justifyContent: 'center',
    alignItems: 'center',
    '@media': {
      '(max-width: 768px)': {
        width: '100%',
        alignItems: 'stretch',
      },
    },
  },
]);

export const headingContainer = style([
  flexCol,
  {
    inset: 0,
    margin: '0rem',
    padding: 0,
    transformOrigin: '0 0',
    boxSizing: 'border-box',
    transform: 'rotate(90deg) translateY(-100%)',
    textOrientation: 'sideways',
    whiteSpace: 'nowrap',
    marginLeft: '-3px',
  },
]);

export const heroHeading = style({
  fontFamily: ZFB20,
  fontSize: '46px',
  letterSpacing: '2px',
  verticalAlign: 'baseline',
  inset: 0,
  color: vars.color.onBackground,
  '@media': {
    '(max-width: 768px)': {
      fontSize: '40px',
    },
  },
});

export const subHeading = style({
  fontFamily: ZFB08,
  fontSize: '16px',
  letterSpacing: '1px',
  width: '100%',
  lineHeight: 1.6,
  color: vars.color.onBackground,
  '@media': {
    '(max-width: 768px)': {
      fontSize: '14px',
    },
  },
});

export const animatedBlock = style({
  opacity: 0,
  transform: 'translateY(12px)',
  transition: 'opacity 420ms ease, transform 420ms ease',
});

export const animatedActive = style({
  opacity: 1,
  transform: 'translateY(0)',
});
