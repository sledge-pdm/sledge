import { flexCol, flexRow, w100 } from '@sledge/core';
import { vars, ZFB09, ZFB11, ZFB31 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const startRoot = style([
  flexRow,
  w100,
  {
    justifySelf: 'center',
    width: '100vw',
    height: '100dvh',
  },
]);

export const leftContent = style([
  flexCol,
  {
    width: '30%',
    height: '100dvh',
    padding: '7rem 4rem',
    gap: '2rem',
    borderRight: `1px solid ${vars.color.border}`,
  },
]);

export const scrollContent = style([
  flexCol,
  w100,
  {
    width: '100%',
    height: '100dvh',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    scrollSnapType: 'y mandatory',
    scrollBehavior: 'smooth',
    overscrollBehavior: 'contain',
  },
]);

export const header = style([
  flexRow,
  {
    height: '56px',
    gap: '2rem',
    alignItems: 'center',
    textDecoration: 'none',
    backgroundColor: 'limegreen',
    '@media': {
      '(max-width: 768px)': {
        height: '36px',
      },
    },
  },
]);

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

export const startImage = style({
  objectFit: 'contain',
  width: '100%',
  height: 'auto',
  borderRadius: '6px',
  overflow: 'hidden',
});

export const startPanel = style([
  flexRow,
  {
    scrollSnapAlign: 'start',
    scrollSnapStop: 'always',
    minHeight: '100dvh',
    height: '100%',
    position: 'relative',
    boxSizing: 'border-box',
    alignItems: 'stretch',
    backgroundColor: vars.color.background,
  },
]);

export const startPanelInner = style([
  flexCol,
  {
    width: '100%',
    height: '100dvh',
    boxSizing: 'border-box',
    justifyContent: 'center',
    gap: '2rem',
    '@media': {
      '(max-width: 768px)': {
        flexWrap: 'wrap',
        padding: `3rem 1rem`,
        gap: '1.5rem',
      },
    },
  },
]);

export const sledgeText = style({
  fontFamily: ZFB31,
  fontSize: '52px',
  letterSpacing: '2px',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '36px',
    },
  },
});

// 行数可変なので固定+マージン取り
export const startTextContainer = style([
  flexCol,
  {
    marginTop: '-1.2rem',
    flexGrow: 1,
  },
]);
export const startText = style({
  fontFamily: ZFB09,
  fontSize: '16px',
  letterSpacing: '2px',
  fontStyle: 'italic',
  opacity: 0.6,

  '@media': {
    '(max-width: 768px)': {
      fontSize: '16px',
      marginBottom: '0.25rem',
    },
  },
});

export const flavorText = style({
  fontFamily: ZFB11,
  fontSize: '16px',
  letterSpacing: '1px',
  marginBottom: '4rem',
  lineHeight: '1.5',
  opacity: 0.2,
  '@media': {
    '(max-width: 768px)': {
      fontSize: '16px',
      marginBottom: '0.25rem',
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
