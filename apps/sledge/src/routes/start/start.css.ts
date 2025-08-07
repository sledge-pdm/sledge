import { flexCol, flexRow, wh100 } from '@sledge/core';
import { vars, ZFB03, ZFB08, ZFB31 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const startRoot = style([
  flexCol,
  {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
]);
export const startContent = style([
  flexCol,
  {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    padding: '40px',
    overflow: 'hidden',
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
    paddingBottom: '48px',
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
      color: vars.color.active,
    },
  },
]);

export const recentFilesCaption = style({
  fontFamily: ZFB08,
  fontSize: '8px',
  color: '#777',
  marginBottom: '8px',
});

export const clear = style({
  fontFamily: ZFB03,
  fontSize: '15px',
  ':hover': {
    color: vars.color.active,
  },
});

export const recentFilesContainerGrid = style([
  {
    width: '100%',
    bottom: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, auto)',
    gap: '8px',
    flexGrow: 1,
    height: 0,
    marginTop: '12px',
  },
]);
export const recentFilesContainerScroll = style([
  flexCol,
  wh100,
  {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflowY: 'auto',
    flexGrow: 1,

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
export const recentFilesContainerCol = style([
  flexCol,
  wh100,
  {
    gap: '2px',
  },
]);

export const rightTopArea = style([
  flexCol,
  {
    position: 'absolute',
    top: 0,
    right: 0,
    margin: vars.spacing.xl,
    boxSizing: 'border-box',
    gap: vars.spacing.md,
    alignItems: 'end',
  },
]);
