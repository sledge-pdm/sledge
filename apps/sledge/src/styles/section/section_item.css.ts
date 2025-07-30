import { flexCol, w100 } from '@sledge/core';
import { vars, ZFB08, ZFB11 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const sectionRoot = style([
  flexCol,
  {
    // border: '1px solid black',
  },
]);

export const sectionCaption = style({
  fontFamily: ZFB11,
  fontSize: vars.text.sm,
  marginBottom: vars.spacing.sm,
  opacity: 0.8,
});

export const sectionSubCaption = style({
  fontFamily: ZFB08,
  fontSize: vars.text.sm,
  marginTop: vars.spacing.sm,
  marginBottom: vars.spacing.xs,
  opacity: 0.6,
});

export const sectionContent = style([flexCol, w100]);
