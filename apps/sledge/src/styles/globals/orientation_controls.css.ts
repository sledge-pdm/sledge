import { flexCol } from '@sledge/core';
import { style } from '@vanilla-extract/css';
import { Consts } from '~/Consts';

export const iconContainer = style([
  flexCol,
  {
    alignContent: 'center',
    alignItems: 'center',
    padding: '6px',
    zIndex: Consts.zIndex.canvasOverlay,
    pointerEvents: 'auto',
    // filter: `drop-shadow(0 0 2px ${vars.color.background})`,
  },
]);

export const canvasTempControlIcon = style([
  flexCol,
  {
    width: '14px',
    height: '14px',
    imageRendering: 'pixelated',
    shapeRendering: 'geometricPrecision',
    alignContent: 'center',
    alignItems: 'center',
    backdropFilter: 'invert()',
    scale: 2,
  },
]);
