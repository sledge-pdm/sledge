import { flexCol, flexRow } from '@sledge/core';
import { vars, ZFB09, ZFB11 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const sideSectionControlRoot = style([
  flexCol,
  {
    boxSizing: 'content-box',
    paddingTop: '20px',
    paddingBottom: '16px',
    width: '23px',
    justifyContent: 'start',
    alignItems: 'center',
  },
]);
export const sideSectionControlList = style([
  flexCol,
  {
    height: '100%',
    alignItems: 'center',
    gap: '24px',
  },
]);
export const sideSectionControlItem = style([
  flexRow,
  {
    justifyContent: 'center',
    transform: 'rotate(180deg)',
  },
]);

export const sideSectionControlToggle = style({
  fontFamily: ZFB11,
  fontSize: '8px',
  padding: '2px',
  cursor: 'pointer',
});

export const sideSectionControlText = style({
  fontFamily: ZFB09,
  fontSize: '8px',
  whiteSpace: 'nowrap',
  writingMode: 'vertical-lr',
  verticalAlign: 'middle',
  color: vars.color.onBackground,
  opacity: 0.65,
});

export const sideSectionControlTextActive = style([
  sideSectionControlText,
  {
    color: vars.color.onBackground,
    opacity: 1,
  },
]);
