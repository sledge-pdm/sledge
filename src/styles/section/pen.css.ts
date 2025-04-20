import { style } from "@vanilla-extract/css";
import { vars } from "../global.css";
import { flexRow, w100 } from "../snippets.css";

export const penConfigRow = style([
  flexRow,
  w100,
  {
    gap: vars.spacing.md,
    alignItems: "center",
  },
]);

export const penConfigRowName = style({
  cursor: "pointer",
  fontSize: vars.text.sm,
  padding: `${vars.spacing.md} 0`,
  pointerEvents: "all",
  width: "20%",
});
