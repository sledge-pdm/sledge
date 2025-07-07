import { flexCol } from '@sledge/core';
import { k12x8, Terminus, ZFB03, ZFB31 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const aaContainer = style([
  flexCol,
  {
    position: 'absolute',
    top: '32px',
    right: '40px',
    width: '200px',
    height: '100%',
    alignItems: 'center',
    pointerEvents: 'none',
  },
]);

export const aaText = style({
  fontFamily: Terminus,
  fontSize: '22px',
  opacity: 0.4,
});

export const contentContainer = style([
  flexCol,
  {
    width: '100%',
    margin: '0 30px',
    marginTop: '8px',
    pointerEvents: 'none',
  },
]);

export const aboutLink = style({
  pointerEvents: 'all',
  borderBottom: '1px solid black',
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
  lineHeight: 1.6,
});

export const aboutFeedback = style({
  fontFamily: k12x8,
  fontSize: '8px',
  marginRight: '50px',
  lineHeight: 1.5,
});
