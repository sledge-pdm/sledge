import { flexCol } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const sideAreaRoot = style([
  flexCol,
  {
    borderRight: `1px solid ${vars.color.border}`,
    paddingLeft: '40px',
    boxSizing: 'border-box',
  },
]);

export const sideAreaMenu = style([
  {
    paddingTop: '36px',
    paddingRight: '30px',
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
    paddingTop: '20px',
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
