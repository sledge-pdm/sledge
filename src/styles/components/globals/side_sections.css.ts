import { style } from '@vanilla-extract/css';
import { vars } from '../../global.css';
import { flexCol, h100 } from '../../snippets.css';

export const sideAreaRoot = style([
  flexCol,
  h100,
  {
    borderRight: '1px solid #aaa',
  },
]);

export const sideAreaMenu = style([
  {
    paddingTop: '12px',
    paddingLeft: '36px',
    paddingRight: '30px',
  },
]);

export const sideAreaContentWrapper = style([
  flexCol,
  h100,
  {
    width: vars.size.side_area,
    paddingTop: '20px',
    paddingLeft: '36px',
    paddingRight: '30px',
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
    width: vars.size.side_area,
    height: 'auto',
  },
]);
