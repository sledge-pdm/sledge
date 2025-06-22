import { style } from '@vanilla-extract/css';
import { vars, ZFB11 } from '~/styles/global.css';
import { flexRow, w100, wh100 } from '~/styles/snippets.css';

export const root = style([
  flexRow,
  w100,
  {
    position: 'fixed',
    borderBottom: `1px solid ${vars.color.border}`,
    height: '28px',
    alignItems: 'end',
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
    paddingLeft: '26px',
    gap: vars.spacing.xs,
  },
]);

export const menuListRight = style([
  flexRow,
  {
    paddingRight: vars.spacing.sm,
    gap: vars.spacing.xs,
  },
]);

export const menuItem = style([
  flexRow,
  {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    height: '26px',
  },
]);

export const menuItemText = style([
  {
    fontFamily: ZFB11,
    fontSize: '8px',
    textRendering: 'geometricPrecision',
    margin: 0,
    alignContent: 'center',
    textAlign: 'center',
    width: '100%',
    height: '30px',
    marginLeft: '8px',
    marginRight: '8px',
  },
]);

export const menuItemBackground = style([
  flexRow,
  {
    position: 'absolute',
    alignItems: 'center',
    left: 0,
    right: 0,
    height: '26px',
    // opacity: 0.1,
    // backgroundColor: vars.color.accent,
    zIndex: -1,
  },
]);
