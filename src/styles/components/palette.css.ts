import { style } from "@vanilla-extract/css";
import { flexRow } from "../snippets.css";

export const paletteRoot = style([
  flexRow,
  {
    gap: "6px",
  },
]);

export const paletteColorBoxContainer = style({
  position: "relative",
});

export const paletteColorBoxPrimary = style({
  position: "absolute",
  top: 0,
  left: 0,
});

export const paletteColorBoxSecondary = style({
  position: "absolute",
  top: 10,
  left: 10,
});
