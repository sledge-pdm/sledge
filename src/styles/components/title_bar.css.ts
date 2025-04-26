import { style } from '@vanilla-extract/css';
import { vars, ZFB08 } from '../global.css';
import { flexCol, flexRow, h100, w100 } from '../snippets.css';

export const titleBarRoot = style([
  flexRow,
  w100,
  {
    background: '#fff',
    pointerEvents: 'all',
    height: '28px',
    // borderBottom: "1px solid #aaa",
    alignItems: 'center',
    zIndex: 9999,
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
    paddingLeft: vars.spacing.lg,
    pointerEvents: 'none',
  },
]);

export const titleBarControls = style([
  flexRow,
  h100,
  {
    gap: vars.spacing.sm,
    marginRight: vars.spacing.sm,
  },
]);

export const titleBarControlButton = style([
  flexCol,
  h100,
  {
    background: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '24px',
    ':hover': {
      backgroundColor: 'transparent',
    },
  },
]);

export const titleBarControlMinimizeButton = style([
  titleBarControlButton,
  {
    ':hover': {
      filter:
        'invert(9%) sepia(100%) saturate(6812%) hue-rotate(247deg) brightness(96%) contrast(146%);', // 青っぽく
    },
  },
]);

export const titleBarControlMaximizeButton = style([
  titleBarControlButton,
  {
    ':hover': {
      filter:
        'invert(92%) sepia(20%) saturate(3846%) hue-rotate(112deg) brightness(105%) contrast(102%);', // 緑っぽく
    },
  },
]);

export const titleBarControlCloseButton = style([
  titleBarControlButton,
  {
    ':hover': {
      filter:
        'invert(11%) sepia(92%) saturate(7351%) hue-rotate(0deg) brightness(99%) contrast(109%);', // 赤っぽく
    },
  },
]);

export const titleBarControlButtonImg = style({
  width: '10px',
  height: '10px',
  imageRendering: 'pixelated',
});
