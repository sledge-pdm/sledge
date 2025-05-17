import { style } from '@vanilla-extract/css';
import { vars, ZFB08 } from '../../global.css';
import { flexCol, flexRow, h100, w100 } from '../../snippets.css';

export const titleBarRoot = style([
  flexRow,
  w100,
  {
    background: '#fff',
    pointerEvents: 'all',
    height: '32px',
    // borderBottom: "1px solid #aaa",
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
    paddingLeft: vars.spacing.lg,
  },
]);

export const titleBarControls = style([flexRow, h100, {}]);

const titleBarControlButton = style([
  flexCol,
  h100,
  {
    background: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '24px',

    paddingLeft: '18px',
    paddingRight: '18px',
  },
]);

export const titleBarControlMinimizeButton = style([
  titleBarControlButton,
  {
    ':hover': {
      backgroundColor: '#0000FF20',
    },
  },
]);

export const titleBarControlMaximizeButton = style([
  titleBarControlButton,
  {
    ':hover': {
      backgroundColor: '#00FF0020',
    },
  },
]);

export const titleBarControlCloseButton = style([
  titleBarControlButton,
  {
    ':hover': {
      backgroundColor: '#FF000020',
    },
  },
]);

const titleBarControlButtonImg = style({
  width: '12px',
  height: '12px',
  imageRendering: 'pixelated',
  pointerEvents: 'none',
});

export const titleBarControlButtonMinimizeImg = style([
  titleBarControlButtonImg,
  {
    selectors: {
      [`${titleBarControlButton}:hover &`]: {
        filter: 'invert(9%) sepia(100%) saturate(6812%) hue-rotate(247deg) brightness(96%) contrast(146%);', // 青っぽく
      },
    },
  },
]);
export const titleBarControlButtonMaximizeImg = style([
  titleBarControlButtonImg,
  {
    selectors: {
      [`${titleBarControlButton}:hover &`]: {
        filter: 'invert(92%) sepia(20%) saturate(3846%) hue-rotate(112deg) brightness(105%) contrast(102%);', // 緑っぽく
      },
    },
  },
]);

export const titleBarControlButtonCloseImg = style([
  titleBarControlButtonImg,
  {
    selectors: {
      [`${titleBarControlButton}:hover &`]: {
        filter: 'invert(11%) sepia(92%) saturate(7351%) hue-rotate(0deg) brightness(99%) contrast(109%) drop-shadow(1px, 0, 0,);', // 赤っぽく
      },
    },
  },
]);
