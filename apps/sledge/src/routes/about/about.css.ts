import { flexCol } from '@sledge/core';
import { k12x8, Terminus, vars, ZFB03, ZFB31 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const aaContainer = style([
  flexCol,
  {
    position: 'absolute',
    top: '16px',
    right: '84px',
    width: '200px',
    height: '100%',
    pointerEvents: 'none',
  },
]);

export const aaText = style({
  fontFamily: Terminus,
  textRendering: 'geometricPrecision',
  fontSize: '32px',
  lineHeight: 1.0,
  letterSpacing: -0.75,
  wordSpacing: 0,
  opacity: 0.15,
});

export const contentContainer = style([
  flexCol,
  {
    width: '100%',
    margin: '0 28px',
    marginTop: '20px',
    pointerEvents: 'none',
  },
]);

export const aboutLink = style({
  pointerEvents: 'all',
  width: 'fit-content',
  ':hover': {
    borderBottom: 'none',
    color: 'magenta',
  },
});

export const aboutTitle = style({
  fontFamily: ZFB31,
  fontSize: '31px',
});

export const aboutSubTitle = style({
  fontFamily: k12x8,
  fontSize: '8px',
  opacity: 0.6,
});

export const newVersionText = style({
  width: 'fit-content',
  fontFamily: ZFB03,
  fontSize: '8px',
  color: vars.color.accent,
  pointerEvents: 'all',
});

export const aboutDev = style({
  fontFamily: ZFB03,
  fontSize: '8px',
});
export const aboutDescription = style({
  color: vars.color.muted,
  fontSize: '8px',
});

export const aboutInspiredText = style({
  fontSize: '8px',
  lineHeight: 2,
});

export const aboutFeedback = style({
  fontFamily: k12x8,
  fontSize: '8px',
  marginRight: '42px',
  lineHeight: 1.5,
});
