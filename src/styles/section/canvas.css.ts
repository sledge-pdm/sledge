import { style } from "@vanilla-extract/css";
import { vars } from "../global.css";
import { flexRow } from "../snippets.css";

export const canvasSizeForm = style([
  flexRow,
  {
    alignItems: "flex-end",
    marginBottom: "6px",
  },
]);

export const canvasSizeLabel = style({
  fontSize: vars.text.sm,
});

export const canvasSizeInput = style({
  fontSize: vars.text.md,
  margin: `${vars.spacing.xs}`,
  width: "50px",
});

export const canvasSizeButton = style({
  margin: vars.spacing.sm,
});
