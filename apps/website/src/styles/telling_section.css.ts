import { flexCol, flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const panel = style([
  flexRow,
  {
    width: '100%',
    scrollSnapAlign: 'start',
    scrollSnapStop: 'always',
    boxSizing: 'border-box',
    alignItems: 'stretch',
    gap: '12px',
  },
]);

export const panelInner = style([
  flexRow,
  {
    width: '100%',
    height: 'auto',
  },
]);

export const sectionContainer = style([
  flexCol,
  {
    width: '100%',
    '@media': {
      '(max-width: 599px)': {
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
      '(max-width: 599px)': {
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
    marginLeft: '-3px',
  },
]);

export const sectionImage = style({
  width: '100%',
  height: 'auto',
  border: `1px solid ${vars.color.muted}`,
  borderRadius: '8px',
  placeItems: 'center',
  imageRendering: 'auto',
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
