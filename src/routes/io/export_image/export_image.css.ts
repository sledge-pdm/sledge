import { style } from '@vanilla-extract/css';
import { vars, ZFB31 } from '~/styles/global.css';
import { flexCol, flexRow, w100, wh100 } from '~/styles/snippets.css';

export const root = style([
  flexRow,
  wh100,
  {
    position: 'relative',
    padding: '32px 32px',
  },
]);

export const header = style([
  {
    fontFamily: ZFB31,
    fontSize: vars.text.lg,
    color: vars.color.accent,
  },
]);

export const content = style([
  flexCol,
  w100,
  {
    flexGrow: 1,
  },
]);

export const previewArea = style([
  flexCol,
  w100,
  {
    flexGrow: 1,
  },
]);
