import { style } from '@vanilla-extract/css';
import { vars } from '~/styles/global.css';
import { flexRow, w100, wh100 } from '~/styles/snippets.css';

export const root = style([
  flexRow,
  w100,
  {
    height: '32px',
    alignItems: 'center',
  },
]);

export const menuList = style([
  flexRow,
  wh100,
  {
    height: '100%',
    alignItems: 'center',
    gap: '8px',
  },
]);

export const menuItem = style([
  flexRow,
  {
    alignItems: 'center',
    padding: `${vars.spacing.xs} 0`,
  },
]);
