import { style } from "@vanilla-extract/css";
import { vars, ZFB03B } from "../global.css";
import { flexCol, flexRow, w100 } from "../snippets.css";

export const layerList = style([
  flexCol,
  w100,
  {
    flexGrow: 1,
    gap: vars.spacing.xs,
    position: "relative",
  },
]);

export const layerItem = style([
  flexRow,
  w100,
  {
    height: "24px",
    padding: vars.spacing.sm,
    flexGrow: 1,
    cursor: "pointer",
    backgroundColor: vars.color.surface,
    borderLeft: "1px solid black",
    ":hover": {
      filter: "brightness(0.94)",
      transform: "translate(0, 1px)",
    },
  },
]);

export const layerItemDisabled = style({
  color: vars.color.muted,
});

export const layerItemType = style([
  w100,
  {
    fontSize: vars.text.sm,
    opacity: 0.4,
    position: "absolute",
    right: 0,
    textAlign: "end",
  },
]);

export const layerItemName = style([
  {
    fontSize: vars.text.xl,
    fontFamily: ZFB03B,
    margin: `${vars.spacing.sm} 0 0 ${vars.spacing.lg}`,
  },
]);

export const dotMagnifContainer = style([
  {
    alignSelf: "center",
    border: "1px black solid",
    borderRadius: vars.spacing.xs,
    cursor: "pointer",
    marginLeft: "auto",
    marginRight: 0,
    padding: `2px ${vars.spacing.xs}`,
    pointerEvents: "all",

    ":hover": {
      color: vars.color.muted,
    },
  },
]);

export const dotMagnifText = style([
  {
    fontFamily: ZFB03B,
    fontSize: vars.text.md,
  },
]);

export const activeLight = style([
  {
    alignSelf: "center",
    margin: `${vars.spacing.sm}px 0`,
    marginLeft: vars.spacing.sm,
  },
]);

export const dropPlaceholder = style([
  {
    border: "2px dashed #aaa",
    borderRadius: vars.spacing.md,
    height: "32px",
    margin: `${vars.spacing.xs}px 0`,
  },
]);
