import { style } from '@vanilla-extract/css';
import { vars, ZFB11 } from '~/styles/global.css';
import { flexCol, w100 } from '~/styles/snippets.css';

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
});

export const sectionContent = style([flexCol, w100]);
