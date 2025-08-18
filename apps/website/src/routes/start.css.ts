import { flexCol, flexRow, w100 } from '@sledge/core';
import { vars, ZFB08, ZFB31 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const startRoot = style([
  flexCol,
  w100,
  {
    height: '100dvh',
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
  width: '56px',
  height: '56px',
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
    flexWrap: 'nowrap',
    width: '100%',
    padding: '5rem 3rem',
    boxSizing: 'border-box',
    '@media': {
      '(max-width: 1600px)': {
        gap: '3rem',
        padding: `5rem 1rem`,
      },
      '(max-width: 768px)': {
        flexWrap: 'wrap',
        gap: '3rem',
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
  width: '55%',
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
  fontSize: '16px',
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
