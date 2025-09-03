import { flexRow } from '@sledge/core';
import { k12x8 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const menuTextContainer = style([
  flexRow,
  {
    boxSizing: 'border-box',
    width: 'auto',
    gap: '12px',
  },
]);

export const menuItem = style([
  flexRow,
  {
    alignItems: 'center',
  },
]);

export const menuText = style({
  fontFamily: `${k12x8}`,
  fontSize: '8px',
  width: 'fit-content',
  textTransform: 'lowercase',
  padding: '2px',
  textDecoration: 'none',

  ':hover': {
    textDecoration: 'underline',
  },

  '@media': {
    '(max-width: 599px)': {
      fontSize: '8px',
    },
  },
});
