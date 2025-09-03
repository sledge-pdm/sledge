import { flexCol } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const rootContainer = style([
  flexCol,
  {
    width: 'auto',
    height: '100dvh',
    overflowX: 'hidden',
    overflowY: 'visible',
    zIndex: 2,
    borderRight: `1px solid ${vars.color.border}`,

    '::-webkit-scrollbar': {
      width: '2px',
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: vars.color.onBackground,
      opacity: 0.3,
    },

    '@media': {
      '(max-width: 599px)': {
        width: '100%',
        borderRight: 'none',
      },
    },
  },
]);

export const pageContainer = style([
  flexCol,
  {
    height: 'auto',
    boxSizing: 'content-box',
    '@media': {
      '(max-width: 599px)': {
        width: '100%',
      },
    },
  },
]);

export const restContainer = style([
  flexCol,
  {
    width: '0',
    flexGrow: 1,
    height: '100dvh',
    alignItems: 'center',
    justifyContent: 'center',

    '@media': {
      '(max-width: 599px)': {
        display: 'none',
      },
    },
  },
]);
