import { flexCol, w100 } from '@sledge/core';
import { vars, ZFB09, ZFB11 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';
import { Consts } from '~/Consts';

export const sectionRoot = style([
  flexCol,
  {
    // border: '1px solid black',
    zIndex: Consts.zIndex.sideSection,
    boxSizing: 'border-box',
    overflow: 'visible',
  },
]);

export const sectionCaption = style({
  fontFamily: ZFB09,
  letterSpacing: '2px',
  fontSize: '8px',
  opacity: 0.8,
  whiteSpace: 'nowrap',
});

export const sectionSubCaption = style({
  fontFamily: ZFB11,
  fontSize: vars.text.sm,
  marginTop: vars.spacing.sm,
  marginBottom: vars.spacing.sm,
  opacity: 0.8,
});

export const sectionContent = style([flexCol, w100, { paddingLeft: '16px', boxSizing: 'border-box', overflow: 'visible' }]);

export const sectionSubContent = style([flexCol, w100, { gap: '8px', paddingLeft: '8px', boxSizing: 'border-box', overflow: 'visible' }]);
