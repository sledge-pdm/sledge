import { flexCol } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const sideAreaRoot = style([
  flexCol,
  {
    boxSizing: 'border-box',
    backgroundColor: vars.color.background,
  },
]);

export const sideAreaContentWrapper = style([
  flexCol,
  {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: '32px',
    paddingBottom: '48px',
    paddingLeft: '20px',
    paddingRight: '20px',

    overflowX: 'hidden',
    overflowY: 'scroll',

    '::-webkit-scrollbar': {
      width: '2px',
      backgroundColor: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: 'transparent',
    },
    selectors: {
      '&:hover::-webkit-scrollbar-thumb': {
        backgroundColor: '#888',
      },
    },
  },
]);

export const sideAreaContent = style([
  flexCol,
  {
    gap: '1rem',
  },
]);
