import { style } from '@vanilla-extract/css';
import { ZFB03B, ZFB09, ZFB31 } from '~/styles/global.css';
import { flexCol, flexRow, w100, wh100 } from '~/styles/snippets.css';

export const welcomeRoot = style([
  flexCol,
  wh100,
  {
    alignItems: 'center',
    justifyContent: 'center',
  },
]);

export const welcomeHeadline = style({
  fontFamily: ZFB31,
  fontSize: '3rem',
  letterSpacing: '8px',
  marginBottom: '12px',
});

export const recentFilesCaption = style({
  fontFamily: ZFB03B,
  fontSize: '16px',
  color: '#000',
  flexGrow: 1,
  marginBottom: '12px',
});

export const clear = style({
  fontFamily: ZFB03B,
  fontSize: '15px',
  ':hover': {
    color: 'red',
  },
});

export const recentFilesContainer = style([
  flexCol,
  w100,
  {
    gap: '8px',
    marginTop: '4px',
  },
]);

export const recentFilesItem = style([
  flexRow,
  w100,
  {
    alignItems: 'center',
    gap: '8px',
  },
]);

export const recentFilesName = style({
  fontFamily: ZFB09,
  fontSize: '0.5rem',
  textOverflow: 'ellipsis',
  color: '#555',
  whiteSpace: 'nowrap',
});

export const recentFilesPath = style({
  fontFamily: ZFB03B,
  fontSize: '0.5rem',
  color: '#00000030',
});

export const sideSection = style([
  flexRow,
  {
    gap: '24px',
    paddingBottom: '48px',
    paddingTop: '12px',
  },
]);

export const sideSectionItem = style([
  flexRow,
  {
    cursor: 'pointer',
    fontSize: '1rem',
    width: 'fit-content',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      color: 'red',
    },
  },
]);
