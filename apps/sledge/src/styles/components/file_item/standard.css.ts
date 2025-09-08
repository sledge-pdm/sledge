import { flexCol, w100 } from '@sledge/core';
import { vars, ZFB03B, ZFB09 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';
import { Consts } from '~/Consts';

export const rfsCaption = style({
  fontFamily: ZFB03B,
  fontSize: '16px',
  color: '#000',
  marginBottom: '4px',
});

export const rfsContainer = style([
  w100,
  {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 130px)',
    gap: '8px',
    marginTop: '12px',
  },
]);

export const rfsItem = style([
  flexCol,
  {
    alignItems: 'center',
    gap: '8px',
  },
]);

export const rfsThumb = style([
  flexCol,
  {
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${vars.color.border}`,
    width: `${Consts.projectThumbnailSize}px`,
    height: `${Consts.projectThumbnailSize}px`,
  },
]);

export const rfsName = style({
  fontFamily: ZFB09,
  fontSize: '0.5rem',
  textOverflow: 'ellipsis',
  color: '#555',
  whiteSpace: 'nowrap',
});

export const rfsPath = style({
  fontFamily: ZFB03B,
  fontSize: '0.5rem',
  color: '#00000030',
});
