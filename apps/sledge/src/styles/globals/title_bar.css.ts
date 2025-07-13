import { flexCol, flexRow, h100, w100 } from '@sledge/core';
import { vars, ZFB08 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const titleBarRoot = style([
  flexRow,
  w100,
  {
    position: 'relative',
    pointerEvents: 'all',
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
    paddingLeft: '32px',
  },
]);

export const titleBarControls = style([flexRow]);

export const titleBarControlButtonContainer = style([
  flexCol,
  h100,
  {
    border: 'none',
    height: '36px',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '24px',
    paddingLeft: '12px',
    paddingRight: '12px',
    pointerEvents: 'all',

    ':hover': {
      backgroundColor: vars.color.button.hover,
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
