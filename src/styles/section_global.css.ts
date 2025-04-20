import { style } from "@vanilla-extract/css";
import { vars, ZFB11 } from "./global.css";
import { flexCol, w100 } from "./snippets.css";

export const sectionRoot = style([
  flexCol,
  {
    // border: '1px solid black',
  },
]);

export const sectionCaption = style({
  fontFamily: ZFB11,
  fontSize: vars.text.xs,
  marginBottom: vars.spacing.md,
});

export const sectionContent = style([flexCol, w100]);
