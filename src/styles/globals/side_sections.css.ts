import { style } from '@vanilla-extract/css';
import { vars } from '../global.css';
import { flexCol, h100 } from '../snippets.css';

export const sideAreaRoot = style([
  flexCol,
  h100,
  {
    borderRight: `1px solid ${vars.color.border}`,
  },
]);

export const sideAreaMenu = style([
  {
    paddingTop: '36px',
    paddingLeft: '36px',
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
    width: vars.size.sideArea,
    paddingTop: '20px',
    paddingLeft: '36px',
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
    width: vars.size.sideArea,
  },
]);
