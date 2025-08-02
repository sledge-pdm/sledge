import { flexCol, flexRow } from '@sledge/core';
import { vars, ZFB11 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const sideSectionControlRoot = style([
  flexCol,
  {
    gap: '20px',
    paddingTop: '20px',
    paddingBottom: '16px',
    width: '24px',
    justifyContent: 'start',
    alignItems: 'center',
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
  fontFamily: ZFB11,
  fontSize: '8px',
  letterSpacing: '1px',
  whiteSpace: 'nowrap',
  writingMode: 'vertical-lr',
  color: vars.color.muted,
});

export const sideSectionControlTextActive = style([
  sideSectionControlText,
  {
    color: vars.color.onBackground,
  },
]);
