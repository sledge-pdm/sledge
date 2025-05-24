import { style } from '@vanilla-extract/css';
import { ZFB11 } from '~/styles/global.css';
import { flexRow, w100 } from '~/styles/snippets.css';

export const item = style([
  flexRow,
  w100,
  {
    height: '20px',
    cursor: 'pointer',
    backgroundColor: 'vars.color.surface',
    borderLeft: '3px solid #333',
    borderTop: '1px solid #333',
    borderRight: '1px solid #333',
    borderBottom: '1px solid #333',

    ':hover': {
      filter: 'brightness(0.94)',
    },
    ':active': {
      transform: 'translate(0, 1px)',
    },
  },
]);

export const name = style([
  w100,
  {
    fontFamily: ZFB11,
    fontSize: '10px',
    padding: '0 8px',
  },
]);
