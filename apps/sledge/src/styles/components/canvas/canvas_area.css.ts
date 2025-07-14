import { flexCol } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const canvasArea = style([
  flexCol,
  {
    backgroundColor: vars.color.canvasArea,
    display: 'flex',
    position: 'relative',
    height: 'calc(100% - 20px)', // Adjust for bottom info height
    width: '100%',
    overflow: 'hidden',
  },
]);
