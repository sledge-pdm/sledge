import { style } from '@vanilla-extract/css';
import { ZFB03B, ZFB09, ZFB31 } from '~/styles/global.css';
import { flexCol, flexRow, w100, wh100 } from '~/styles/snippets.css';
import { Consts } from '~/utils/consts';

export const welcomeRoot = style([
  flexCol,
  wh100,
  {
    padding: '42px',
  },
]);

export const welcomeHeadline = style({
  fontFamily: ZFB31,
  fontSize: '31px',
  letterSpacing: '1px',
  marginBottom: '2px',
});

export const recentFilesCaption = style({
  fontFamily: ZFB03B,
  fontSize: '16px',
  color: '#000',
  marginBottom: '4px',
});

export const clear = style({
  fontFamily: ZFB03B,
  fontSize: '15px',
  ':hover': {
    color: 'red',
  },
});

export const recentFilesContainer = style([
  w100,
  {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 130px)',
    gap: '8px',
    marginTop: '12px',
  },
]);

export const recentFilesItem = style([
  flexCol,
  {
    alignItems: 'center',
    gap: '8px',
  },
]);

export const recentFilesThumb = style([
  flexCol,
  {
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #aaa',
    width: `${Consts.projectThumbnailSize}px`,
    height: `${Consts.projectThumbnailSize}px`,
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
    paddingBottom: '24px',
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
