import { style } from '@vanilla-extract/css';
import { vars, ZFB11 } from '~/styles/global.css';
import { flexRow, w100 } from '~/styles/snippets.css';

export const item = style([
  flexRow,
  w100,
  {
    height: '20px',
    cursor: 'pointer',
    backgroundColor: 'vars.color.surface',
    border: `1px solid ${vars.color.border}`,
    borderLeft: `3px solid ${vars.color.border}`,

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
