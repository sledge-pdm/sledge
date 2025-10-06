import { flexCol, flexRow, h100, w100 } from '@sledge/core';
import { k12x8, vars, ZFB03, ZFB08 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const titleBarRoot = style([
  flexRow,
  w100,
  {
    position: 'relative',
    pointerEvents: 'all',
    backgroundColor: vars.color.controls,
    alignItems: 'center',
  },
]);

export const titleBarTitleContainer = style([
  flexRow,
  w100,
  {
    marginRight: 'auto',
    paddingLeft: '24px',
    alignItems: 'center',
  },
]);
export const titleBarTitle = style([
  {
    width: 'fit-content',
    fontFamily: k12x8,
    fontSize: '8px',
    height: '8px',
    verticalAlign: 'bottom',
    whiteSpace: 'pre',
  },
]);
export const titleBarTitleSub = style([
  {
    width: 'fit-content',
    fontFamily: ZFB03,
    fontSize: vars.text.sm,
    whiteSpace: 'pre',
    height: '8px',
    verticalAlign: 'bottom',
    opacity: 0.5,
  },
]);
export const titleBarSize = style([
  {
    width: 'fit-content',
    fontFamily: ZFB08,
    fontSize: '8px',
    whiteSpace: 'pre',
  },
]);

export const titleBarSaveSection = style([
  flexRow,
  {
    width: 'fit-content',
    height: '100%',
    alignItems: 'center',

    margin: '0 12px',
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
    paddingLeft: '16px',
    paddingRight: '16px',
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
