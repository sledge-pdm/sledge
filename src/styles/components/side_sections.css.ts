import { style } from '@vanilla-extract/css';
import { vars } from '../global.css';
import { flexCol, h100 } from '../snippets.css';

export const sideAreaContent = style([
  flexCol,
  h100,
  {
    borderRight: '1px solid #aaa',
    gap: '1rem',
    marginLeft: vars.size.edge_info,
    padding: '20px 30px 90px 20px',
    width: vars.size.side_area,
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
