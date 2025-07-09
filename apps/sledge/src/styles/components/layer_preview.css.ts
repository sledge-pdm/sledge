import { wh100 } from '@sledge/core';
import { style } from '@vanilla-extract/css';

export const layerPreviewCanvas = style([
  wh100,
  {
    imageRendering: 'crisp-edges',
  },
]);
