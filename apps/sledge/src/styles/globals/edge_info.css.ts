import { flexCol, flexRow } from '@sledge/core';
import { vars, ZFB11 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const edgeInfoRoot = style([
  flexCol,
  {
    gap: '20px',
    paddingTop: '16px',
    paddingBottom: '16px',
    paddingLeft: '8px',
    paddingRight: '4px',
    width: '24px',
    justifyContent: 'start',
    alignItems: 'center',
  },
]);
export const edgeInfoItem = style([
  flexRow,
  {
    justifyContent: 'center',
    transform: 'rotate(180deg)',
  },
]);

export const edgeInfoText = style({
  fontFamily: ZFB11,
  fontSize: '8px',
  letterSpacing: '1px',
  whiteSpace: 'nowrap',
  writingMode: 'vertical-lr',
});

export const edgeInfoTextActive = style([
  edgeInfoText,
  {
    color: vars.color.accent,
  },
]);
