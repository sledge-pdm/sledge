import { style } from '@vanilla-extract/css';

export const topRightNav = style({
  display: 'flex',
  flexDirection: 'row',
  gap: '25px',
  position: 'absolute',
  right: '30px',
  top: '30px',
});

export const undoRedo = style({
  cursor: 'pointer',
  height: '24px',
  imageRendering: 'pixelated',
  padding: '8px',
  pointerEvents: 'all',
  width: '24px',
});
