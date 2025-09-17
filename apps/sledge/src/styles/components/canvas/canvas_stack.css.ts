'background-image';
import { flexRow } from '@sledge/core';
import { style } from '@vanilla-extract/css';

export const canvasStack = style([
  flexRow,
  {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
]);
