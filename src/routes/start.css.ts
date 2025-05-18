import { style } from '@vanilla-extract/css';
import { vars, ZFB03, ZFB08, ZFB31 } from '~/styles/global.css';
import { flexCol, flexRow, w100, wh100 } from '~/styles/snippets.css';

export const startRoot = style([
  flexCol,
  wh100,
  {
    position: 'relative',
    padding: '48px 42px',
  },
]);

export const startHeader = style({
  fontFamily: ZFB31,
  fontSize: '36px',
  letterSpacing: '2px',
  marginBottom: '8px',
});

export const header = style([
  flexRow,
  {
    gap: '24px',
    paddingBottom: '36px',
    paddingTop: '12px',
  },
]);

export const headerItem = style([
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

export const recentFilesCaption = style({
  fontFamily: ZFB08,
  fontSize: '8px',
  color: '#777',
  marginBottom: '4px',
});

export const clear = style({
  fontFamily: ZFB03,
  fontSize: '15px',
  ':hover': {
    color: 'red',
  },
});

export const recentFilesContainerGrid = style([
  w100,
  {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, auto)',
    gap: '8px',
    marginTop: '12px',
  },
]);
export const recentFilesContainerScroll = style([
  flexCol,
  {
    position: 'relative',
    marginTop: '12px',
    maxHeight: '240px',
    width: '500px',
  },
]);
export const recentFilesContainerCol = style([
  flexCol,
  w100,
  {
    position: 'relative',
    gap: '8px',
    overflowX: 'hidden',
    overflowY: 'auto',

    '::-webkit-scrollbar': {
      width: '4px',
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: 'transparent',
    },
    selectors: {
      '&:hover::-webkit-scrollbar-thumb': {
        backgroundColor: '#ddd',
      },
    },
  },
]);

export const rightBottomArea = style([
  flexCol,
  {
    position: 'fixed',
    bottom: vars.spacing.xl,
    right: vars.spacing.xl,
    gap: vars.spacing.md,
    alignItems: 'end',
  },
]);
