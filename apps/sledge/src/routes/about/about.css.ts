import { flexCol } from '@sledge/core';
import { k12x8, Terminus, ZFB03, ZFB31 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const aaContainer = style([
  flexCol,
  {
    position: 'absolute',
    top: '48px',
    right: '72px',
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
  letterSpacing: 0,
  opacity: 0.25,
});

export const contentContainer = style([
  flexCol,
  {
    width: '100%',
    margin: '0 30px',
    marginTop: '16px',
    pointerEvents: 'none',
  },
]);

export const aboutLink = style({
  pointerEvents: 'all',
  // borderBottom: '1px solid black',
  paddingBottom: '1px',
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
  fontFamily: ZFB03,
  fontSize: '9px',
  color: '#777',
});

export const aboutDev = style({
  fontFamily: ZFB03,
  fontSize: '8px',
});

export const aboutContent = style({
  fontFamily: ZFB03,
  fontSize: '8px',
  lineHeight: 2.2,
});

export const aboutFeedback = style({
  fontFamily: k12x8,
  fontSize: '8px',
  marginRight: '42px',
  lineHeight: 1.5,
});
