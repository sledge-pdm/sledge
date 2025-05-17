import { style } from '@vanilla-extract/css';
import { vars } from '../../global.css';
import { flexCol, h100 } from '../../snippets.css';

export const sideAreaRoot = style([
  flexCol,
  h100,
  {
    borderRight: '1px solid #aaa',
    marginLeft: vars.size.edge_info,
    paddingTop: '10px',
    height: 'auto',
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
export const sideAreaMenu = style([{ margin: `8px 20px` }]);

export const sideAreaContent = style([
  flexCol,
  h100,
  {
    gap: '1rem',
    width: vars.size.side_area,
    padding: '10px 30px 90px 20px',
    height: 'auto',
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
