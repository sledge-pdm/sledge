import { style } from '@vanilla-extract/css';
import { wh100 } from '../snippets.css';

export const layerPreviewCanvas = style([
  wh100,
  {
    imageRendering: 'crisp-edges',
  },
]);
