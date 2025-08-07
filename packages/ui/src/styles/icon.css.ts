import { createVar, style } from '@vanilla-extract/css';

export const pxVar = createVar();
export const fillVar = createVar();
export const hoverFillVar = createVar();
export const urlVar = createVar();

export const icon = style({
  width: pxVar, // ← 直接渡す
  height: pxVar,
  backgroundColor: fillVar,
  mask: `${urlVar} center/contain no-repeat`,
  WebkitMask: `${urlVar} center/contain no-repeat`,
  imageRendering: 'pixelated',

  selectors: {
    '&:hover': {
      backgroundColor: hoverFillVar,
    },
  },
});
