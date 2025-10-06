import { flexCol, w100 } from '@sledge/core';
import { vars, ZFB03B, ZFB09 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';
import { Consts } from '~/Consts';

export const sectionRoot = style([
  flexCol,
  {
    // border: '1px solid black',
    zIndex: Consts.zIndex.sideSection,
    padding: '8px',
    boxSizing: 'border-box',
    overflow: 'visible',
  },
]);

export const sectionCaption = style({
  fontFamily: ZFB09,
  letterSpacing: '3px',
  fontSize: '8px',
  opacity: 1,
  whiteSpace: 'nowrap',
});

export const sectionSubCaption = style({
  fontFamily: ZFB03B,
  fontSize: vars.text.sm,
  marginTop: vars.spacing.sm,
  marginBottom: vars.spacing.sm,
  opacity: 0.7,
});

export const sectionContent = style([flexCol, w100, { paddingLeft: '4px', boxSizing: 'border-box', overflow: 'visible' }]);

export const sectionSubContent = style([flexCol, w100, { gap: '8px', paddingLeft: '8px', boxSizing: 'border-box', overflow: 'visible' }]);
