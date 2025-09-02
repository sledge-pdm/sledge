import { flexCol, flexRow, w100 } from '@sledge/core';
import { vars, ZFB08, ZFB09, ZFB11, ZFB31 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const startRoot = style([
  flexCol,
  w100,
  {
    justifySelf: 'center',
    width: '80%',
    height: '100dvh',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    scrollSnapType: 'y mandatory',
    scrollBehavior: 'smooth',
    overscrollBehavior: 'contain',
    backgroundColor: vars.color.background,
  },
]);

export const scrollContent = style([
  flexCol,
  w100,
  {
    overflowY: 'visible',
    overflowX: 'hidden',
    padding: '42px 42px',
    boxSizing: 'border-box',
    backgroundColor: vars.color.background,
    '@media': {
      '(max-width: 768px)': {
        padding: `${vars.spacing.xl} ${vars.spacing.lg}`,
        paddingBottom: '80px',
      },
    },
  },
]);

export const header = style([
  flexRow,
  {
    height: '56px',
    gap: '2rem',
    alignItems: 'center',
    textDecoration: 'none',
    '@media': {
      '(max-width: 768px)': {
        height: '36px',
      },
    },
  },
]);

export const startIcon = style({
  width: '48px',
  height: '48px',
  imageRendering: 'pixelated',
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
    position: 'relative',
    flexWrap: 'nowrap',
    width: '100%',
    padding: '1rem 3rem',
    boxSizing: 'border-box',
    zIndex: 1,
    pointerEvents: 'none',
    '@media': {
      '(max-width: 1600px)': {
        gap: '3rem',
        padding: `3rem 1rem`,
      },
      '(max-width: 768px)': {
        flexWrap: 'wrap',
        gap: '3rem',
        padding: `3rem 1rem`,
      },
    },
  },
]);

export const description = style([
  flexCol,
  {
    width: '45%',
    padding: '1rem 5rem',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    zIndex: 2,
    '@media': {
      '(max-width: 1600px)': {},
      '(max-width: 768px)': {
        width: '100%',
        padding: 0,
        gap: '1rem',
      },
    },
  },
]);

export const startImageContainer = style({
  position: 'absolute',
  top: '15%',
  right: '5%',
  width: '40%',
  pointerEvents: 'none',
  zIndex: 0,
  '@media': {
    '(max-width: 1600px)': {
      padding: 0,
      width: '55%',
    },
    '(max-width: 768px)': {
      width: '100%',
      gap: '1rem',
    },
  },
});

export const startImage = style({
  objectFit: 'contain',
  width: '100%',
});

export const greetText = style({
  fontFamily: ZFB31,
  fontSize: '80px',
  letterSpacing: '2px',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '36px',
    },
  },
});

export const startText = style({
  fontFamily: ZFB09,
  fontSize: '16px',
  marginTop: '-1.5rem',
  marginBottom: '72px',
  letterSpacing: '2px',
  fontStyle: 'italic',

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

export const ButtonAreaContainer = style([
  flexCol,
  {
    gap: '1rem',
  },
]);

export const versionInfoText = style({
  fontFamily: ZFB09,
  fontSize: '8px',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '8px',
    },
  },
});
export const informationText = style({
  fontSize: '8px',
  userSelect: 'text',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '8px',
    },
  },
});

export const mainButtonContainer = style([
  flexRow,
  {
    marginTop: '0.5rem',
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
  minWidth: '180px',
  fontSize: '16px',
  padding: '16px 28px',
  borderWidth: '2px',
  borderRadius: '4px',
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
export const subButton = style({
  fontSize: '8px',
  padding: '8px 14px',
  borderWidth: '2px',
  borderRadius: '4px',
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

// --- Scroll telling specific ---
export const panel = style([
  flexRow,
  {
    scrollSnapAlign: 'start',
    scrollSnapStop: 'always',
    minHeight: '100dvh',
    position: 'relative',
    boxSizing: 'border-box',
    alignItems: 'stretch',
  },
]);

export const panelInner = style([
  flexRow,
  {
    width: '100%',
    boxSizing: 'border-box',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '2rem',
    padding: '4rem 10rem',
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
    width: '55%',
    height: '70%',
    gap: '1.5rem',
    '@media': {
      '(max-width: 768px)': {
        width: '100%',
      },
    },
  },
]);

export const rightCol = style([
  flexCol,
  {
    width: '45%',
    alignItems: 'flex-end',
    '@media': {
      '(max-width: 768px)': {
        width: '100%',
        alignItems: 'stretch',
      },
    },
  },
]);

export const heroHeading = style({
  fontFamily: ZFB31,
  fontSize: '64px',
  textTransform: 'uppercase',
  textRendering: 'geometricPrecision',
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
