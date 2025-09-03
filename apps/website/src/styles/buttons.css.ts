import { flexRow } from '@sledge/core';
import { k12x8, vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const mainButtonContainer = style([
  flexRow,
  {
    // justifyContent: 'end',
    gap: '2rem',
    flexWrap: 'wrap',
    '@media': {
      '(max-width: 599px)': {
        gap: '1rem',
      },
    },
  },
]);

export const mainLink = style({
  fontFamily: k12x8,
  fontSize: '8px',
  letterSpacing: '0px',
  color: vars.color.accent,
  textDecoration: 'underline',
  '@media': {
    '(any-hover: hover)': {
      ':hover': {
        color: vars.color.active,
        textDecoration: 'none',
      },
    },
  },
});

export const mainButton = style({
  minWidth: '120px',
  fontSize: '16px',
  padding: '8px 20px',
  borderWidth: '2px',
  borderRadius: '4px',
  '@media': {
    '(any-hover: hover)': {
      ':hover': {
        backgroundColor: vars.color.accent,
        borderColor: vars.color.accent,
        color: vars.color.background,
      },
    },
  },
});

export const subButton = style({
  fontSize: '8px',
  padding: '8px 14px',
  borderWidth: '2px',
  borderRadius: '4px',
  '@media': {
    '(any-hover: hover)': {
      ':hover': {
        backgroundColor: vars.color.accent,
        borderColor: vars.color.accent,
        color: vars.color.background,
      },
    },
    '(max-width: 599px)': {
      borderWidth: '2px',
      padding: '12px 24px',
    },
  },
});
