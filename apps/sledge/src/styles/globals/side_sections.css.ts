import { flexCol } from '@sledge/core';
import { style } from '@vanilla-extract/css';

export const sideAreaRoot = style([
  flexCol,
  {
    boxSizing: 'border-box',
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
    paddingTop: '48px',
    paddingLeft: '32px',
    paddingRight: '30px',

    overflowX: 'hidden',
    overflowY: 'scroll',

    '::-webkit-scrollbar': {
      width: '4px',
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: 'transparent',
    },
    selectors: {
      '&:hover::-webkit-scrollbar-thumb': {
        backgroundColor: '#ddd',
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
