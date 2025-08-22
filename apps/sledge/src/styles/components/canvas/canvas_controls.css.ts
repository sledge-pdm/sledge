import { flexCol } from '@sledge/core';
import { style } from '@vanilla-extract/css';
import { Consts } from '~/models/Consts';

export const topRightNav = style({
  display: 'flex',
  flexDirection: 'row',
  gap: '36px',
  padding: '36px',
  position: 'absolute',
  right: '0px',
  top: '0px',
});

export const undoRedoContainer = style([
  flexCol,
  {
    alignContent: 'center',
    alignItems: 'center',
    padding: '12px',
    zIndex: Consts.zIndex.canvasOverlay,
    pointerEvents: 'auto',
  },
]);

export const undoIcon = style([
  flexCol,
  {
    width: '8px',
    height: '8px',
    imageRendering: 'pixelated',
    shapeRendering: 'geometricPrecision',
    alignContent: 'center',
    alignItems: 'center',
    backdropFilter: 'invert()',
    scale: 2,
  },
]);

export const redoIcon = style([
  flexCol,
  {
    width: '8px',
    height: '8px',
    imageRendering: 'pixelated',
    shapeRendering: 'geometricPrecision',
    alignContent: 'center',
    alignItems: 'center',
    backdropFilter: 'invert()',
    scale: 2,
  },
]);
