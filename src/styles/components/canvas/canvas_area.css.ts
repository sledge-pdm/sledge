import { style } from "@vanilla-extract/css";
import { vars } from "~/styles/global.css";
import { flexCol } from "../../snippets.css";

export const canvasArea = style([
  flexCol,
  {
    backgroundColor: vars.color.bg_canvas_area,
    display: "flex",
    flex: 1,
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
]);
