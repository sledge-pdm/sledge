import { flexCol } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';
import { Consts } from '~/Consts';

export const sideAreaRoot = style([
  flexCol,
  {
    boxSizing: 'border-box',
    backgroundColor: vars.color.background,
    zIndex: Consts.zIndex.sideSection,
    overflowX: 'visible',
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
    paddingLeft: '24px',
    paddingRight: '24px',
    overflowX: 'visible',
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
    overflowX: 'visible',
    gap: '1rem',
  },
]);
