import { style } from '@vanilla-extract/css';
import { vars } from '~/styles/global.css';
import { ZFB08 } from '../global.css';
import { flexCol, flexRow, h100, w100 } from '../snippets.css';

export const titleBarRoot = style([
  flexRow,
  w100,
  {
    pointerEvents: 'all',
    height: '26px',
    backgroundColor: vars.color.background,
    alignItems: 'center',
  },
]);

export const titleBarTitle = style([
  flexRow,
  w100,
  {
    width: 'fit-content',
    fontFamily: ZFB08,
    fontSize: vars.text.sm,
    marginRight: 'auto',
    paddingLeft: '36px',
  },
]);

export const titleBarControls = style([flexRow]);

export const titleBarControlButtonContainer = style([
  flexCol,
  h100,
  {
    border: 'none',
    height: '26px',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '24px',
    paddingLeft: '12px',
    paddingRight: '12px',
    pointerEvents: 'all',

    ':hover': {
      backgroundColor: '#00000020',
    },
  },
]);
export const titleBarControlCloseButtonContainer = style([
  titleBarControlButtonContainer,
  {
    ':hover': {
      backgroundColor: '#FF0000B0',
    },
  },
]);

export const titleBarControlButtonImg = style([
  {
    border: 'none',
    imageRendering: 'pixelated',
  },
]);
