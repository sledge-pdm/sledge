import { style } from '@vanilla-extract/css';
import { vars } from '~/styles/global.css';
import { flexRow, w100, wh100 } from '~/styles/snippets.css';

export const root = style([
  flexRow,
  w100,
  {
    position: 'fixed',
    borderBottom: `1px solid ${vars.color.border}`,
    height: '28px',
    alignItems: 'center',
    zIndex: 20,
  },
]);

export const menuList = style([
  flexRow,
  wh100,
  {
    alignItems: 'center',
  },
]);

export const menuListLeft = style([
  flexRow,
  {
    flexGrow: 1,
    alignItems: 'center',
    gap: vars.spacing.xl,
    paddingLeft: '36px',
  },
]);

export const menuListRight = style([
  flexRow,
  {
    alignItems: 'center',
    gap: vars.spacing.xl,
    paddingRight: vars.spacing.xl,
  },
]);

export const menuItem = style([
  flexRow,
  {
    alignItems: 'center',
    padding: `${vars.spacing.xs} 0`,
  },
]);
