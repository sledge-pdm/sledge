import { flexCol } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';
import { Consts } from '~/Consts';

export const topLeftNav = style({
  display: 'flex',
  flexDirection: 'row',
  left: '0px',
  top: '0px',
  // flexDirection: 'row-reverse',
  // right: '0px',
  // bottom: '0px',
  alignItems: 'center',
  padding: '4px',
  gap: '4px',
  margin: '8px',
  position: 'absolute',
  // backgroundColor: '#00000030',
  zIndex: Consts.zIndex.canvasOverlay,
  borderRadius: '4px',
});

export const canvasTempControlContainer = style([
  flexCol,
  {
    alignContent: 'center',
    alignItems: 'center',
    padding: '8px',
    zIndex: Consts.zIndex.canvasOverlay,
    pointerEvents: 'auto',
    filter: `drop-shadow(0 0 2px ${vars.color.background})`,
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
