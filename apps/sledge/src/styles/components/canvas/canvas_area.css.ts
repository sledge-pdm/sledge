import { flexCol } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const canvasArea = style([
  flexCol,
  {
    backgroundColor: vars.color.canvasArea,
    display: 'flex',
    margin: 0,
    padding: 0,
  },
]);
