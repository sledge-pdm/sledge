import { flexRow } from '@sledge/core';
import { ZFB09 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const menuTextContainer = style([
  flexRow,
  {
    boxSizing: 'content-box',
    overflowX: 'visible',
    width: 'auto',
    marginTop: '1.5rem',
    flexGrow: 1,
    gap: '1rem',
  },
]);

export const menuItem = style([
  flexRow,
  {
    alignItems: 'center',
    gap: '8px',
  },
]);

export const menuText = style({
  fontFamily: ZFB09,
  fontSize: '8px',
  width: 'fit-content',
  textDecoration: 'none',
  padding: '2px',

  ':hover': {
    textDecoration: 'underline',
  },

  '@media': {
    '(max-width: 599px)': {
      fontSize: '8px',
    },
  },
});
