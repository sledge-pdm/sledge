import { style } from "@vanilla-extract/css";
import { k12x8, Terminus, ZFB03, ZFB08, ZFB31 } from "~/styles/global.css";
import { flexCol } from "~/styles/snippets.css";

export const aaContainer = style([
  flexCol,
  {
    position: "absolute",
    top: "10px",
    right: "30px",
    width: "200px",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
]);

export const aaText = style({
  fontFamily: Terminus,
  fontSize: "20px",
  opacity: 0.7,
});

export const contentContainer = style([
  flexCol,
  {
    position: "absolute",
    top: "10px",
    left: "40px",
    height: "100%",
    justifyContent: "center",
    pointerEvents: "none",
    zIndex: 10,
  },
]);

export const aboutLink = style({
  pointerEvents: "all",
  borderBottom: "1px solid black",
  paddingBottom: "1px",

  ":hover": {
    borderBottom: "none",
    color: "magenta",
  },
});

export const aboutTitle = style({
  fontFamily: ZFB31,
  fontSize: "31px",
});

export const aboutSubTitle = style({
  fontFamily: ZFB03,
  fontSize: "9px",
  color: "#aaa",
});

export const aboutDev = style({
  fontFamily: ZFB08,
  fontSize: "8px",
});

export const aboutContent = style({
  fontFamily: ZFB08,
  fontSize: "8px",
});

export const sendFBButton = style({
  width: "fit-content",
  margin: "4px 0",
  fontSize: "8px",
});

export const aboutFeedback = style({
  fontFamily: k12x8,
  fontSize: "8px",
});
