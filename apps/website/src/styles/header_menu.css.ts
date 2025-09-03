import { flexRow } from '@sledge/core';
import { ZFB09 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const menuTextContainer = style([
  flexRow,
  {
    boxSizing: 'border-box',
    width: 'auto',
    gap: '16px',
  },
]);

export const menuItem = style([
  flexRow,
  {
    alignItems: 'center',
  },
]);

export const menuText = style({
  fontFamily: `${ZFB09}`,
  fontSize: '8px',
  letterSpacing: '2px',
  textDecoration: 'none',

  '@media': {
    '(any-hover: hover)': {
      ':hover': {
        textDecoration: 'underline',
      },
    },
    '(max-width: 599px)': {
      fontSize: '8px',
    },
  },
});
